import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import { prisma } from '@/lib/prisma'

const execAsync = promisify(exec)

export interface BackupConfig {
  databaseUrl: string
  backupDir: string
  retentionDays: number
  schedule: string // cron expression
  compression: boolean
  encryption?: {
    enabled: boolean
    key?: string
  }
}

export class BackupService {
  private config: BackupConfig

  constructor(config: BackupConfig) {
    this.config = config
  }

  // Create a database backup
  async createBackup(): Promise<{ success: boolean; filePath?: string; error?: string }> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      let backupFileName = `backup-${timestamp}.sql`
      const backupPath = path.join(this.config.backupDir, backupFileName)

      // Ensure backup directory exists
      await fs.mkdir(this.config.backupDir, { recursive: true })

      // Create pg_dump command
      let dumpCommand = `pg_dump "${this.config.databaseUrl}" -f "${backupPath}" --no-password --clean --if-exists`

      if (this.config.compression) {
        dumpCommand += ` && gzip "${backupPath}"`
        backupFileName += '.gz'
      }

      // Execute backup command
      const { stdout, stderr } = await execAsync(dumpCommand)

      if (stderr) {
        console.warn('Backup warning:', stderr)
      }

      console.log('Database backup created successfully:', backupPath)

      // Log backup in database
      await prisma.backupLog.create({
        data: {
          fileName: backupFileName,
          filePath: backupPath,
          fileSize: await this.getFileSize(backupPath),
          status: 'SUCCESS',
          createdAt: new Date()
        }
      })

      return { success: true, filePath: backupPath }
    } catch (error) {
      console.error('Backup failed:', error)

      // Log failed backup
      await prisma.backupLog.create({
        data: {
          status: 'FAILED',
          error: error instanceof Error ? error.message : 'Unknown error',
          createdAt: new Date()
        }
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Restore from backup
  async restoreBackup(backupFilePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate backup file exists
      await fs.access(backupFilePath)

      // Create restore command
      let restoreCommand = `psql "${this.config.databaseUrl}" -f "${backupFilePath}" --no-password`

      // Execute restore command
      const { stdout, stderr } = await execAsync(restoreCommand)

      if (stderr && !stderr.includes('NOTICE')) {
        console.warn('Restore warning:', stderr)
      }

      console.log('Database restored successfully from:', backupFilePath)

      // Log restore operation
      await prisma.backupLog.create({
        data: {
          fileName: path.basename(backupFilePath),
          filePath: backupFilePath,
          status: 'RESTORED',
          createdAt: new Date()
        }
      })

      return { success: true }
    } catch (error) {
      console.error('Restore failed:', error)

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Clean old backups based on retention policy
  async cleanupOldBackups(): Promise<{ deletedCount: number; errors: string[] }> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)

      // Get old backup logs
      const oldBackups = await prisma.backupLog.findMany({
        where: {
          status: 'SUCCESS',
          createdAt: { lt: cutoffDate }
        }
      })

      let deletedCount = 0
      const errors: string[] = []

      for (const backup of oldBackups) {
        try {
          // Delete physical file
          if (backup.filePath) {
            await fs.unlink(backup.filePath)
          }

          // Delete log entry
          await prisma.backupLog.delete({
            where: { id: backup.id }
          })

          deletedCount++
        } catch (error) {
          const errorMsg = `Failed to delete backup ${backup.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
          console.error(errorMsg)
        }
      }

      console.log(`Cleaned up ${deletedCount} old backups`)
      return { deletedCount, errors }
    } catch (error) {
      const errorMsg = `Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMsg)
      return { deletedCount: 0, errors: [errorMsg] }
    }
  }

  // Get backup statistics
  async getBackupStats(): Promise<{
    totalBackups: number
    totalSize: number
    oldestBackup?: Date
    newestBackup?: Date
    successRate: number
  }> {
    try {
      const backups = await prisma.backupLog.findMany({
        where: { status: 'SUCCESS' },
        orderBy: { createdAt: 'desc' }
      })

      const totalSize = backups.reduce((sum, backup) => sum + (backup.fileSize || 0), 0)

      const oldestBackup = backups.length > 0 ? backups[backups.length - 1]?.createdAt : undefined
      const newestBackup = backups.length > 0 ? backups[0]?.createdAt : undefined

      // Calculate success rate (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const recentBackups = await prisma.backupLog.findMany({
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      })

      const successCount = recentBackups.filter(b => b.status === 'SUCCESS').length
      const successRate = recentBackups.length > 0 ? (successCount / recentBackups.length) * 100 : 0

      return {
        totalBackups: backups.length,
        totalSize,
        oldestBackup,
        newestBackup,
        successRate
      }
    } catch (error) {
      console.error('Failed to get backup stats:', error)
      throw error
    }
  }

  // List available backups
  async listBackups(limit: number = 50): Promise<Array<{
    id: string
    fileName: string
    filePath: string | null
    fileSize: number | null
    status: string
    createdAt: Date
    error?: string | null
  }>> {
    try {
      const backups = await prisma.backupLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return backups.map(backup => ({
        id: backup.id,
        fileName: backup.fileName,
        filePath: backup.filePath,
        fileSize: backup.fileSize,
        status: backup.status,
        createdAt: backup.createdAt,
        error: backup.error
      }))
    } catch (error) {
      console.error('Failed to list backups:', error)
      throw error
    }
  }

  // Verify backup integrity
  async verifyBackup(backupFilePath: string): Promise<{ valid: boolean; error?: string }> {
    try {
      // Check if file exists
      await fs.access(backupFilePath)

      // Basic file size check
      const stats = await fs.stat(backupFilePath)
      if (stats.size === 0) {
        return { valid: false, error: 'Backup file is empty' }
      }

      // For SQL files, we could do more advanced checks like:
      // - Check if file contains valid SQL
      // - Test restore on a test database
      // - Verify table structures

      return { valid: true }
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath)
      return stats.size
    } catch {
      return 0
    }
  }

  // Schedule automatic backups (to be called by a cron job)
  static async runScheduledBackup(): Promise<void> {
    const config: BackupConfig = {
      databaseUrl: process.env.DATABASE_URL || '',
      backupDir: path.join(process.cwd(), 'backups'),
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      schedule: process.env.BACKUP_SCHEDULE || '0 2 * * *', // Daily at 2 AM
      compression: process.env.BACKUP_COMPRESSION === 'true',
      encryption: {
        enabled: process.env.BACKUP_ENCRYPTION === 'true',
        key: process.env.BACKUP_ENCRYPTION_KEY
      }
    }

    const backupService = new BackupService(config)

    // Create backup
    const result = await backupService.createBackup()

    if (result.success) {
      console.log('Scheduled backup completed successfully')

      // Cleanup old backups
      await backupService.cleanupOldBackups()
      console.log('Old backups cleaned up')
    } else {
      console.error('Scheduled backup failed:', result.error)
    }
  }
}

// Manual backup function for API endpoint
export async function createManualBackup(): Promise<{ success: boolean; filePath?: string; error?: string }> {
  const config: BackupConfig = {
    databaseUrl: process.env.DATABASE_URL || '',
    backupDir: path.join(process.cwd(), 'backups'),
    retentionDays: 30,
    schedule: '',
    compression: true
  }

  const backupService = new BackupService(config)
  return await backupService.createBackup()
}
