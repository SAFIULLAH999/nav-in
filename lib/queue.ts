import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email'
import { Logger } from '@/lib/logger'

export interface JobData {
  id: string
  type: string
  data: any
  priority: number
  attempts: number
  maxAttempts: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  scheduledFor: Date
  createdAt: Date
  updatedAt: Date
  error?: string
}

export class QueueService {
  // Add job to queue
  static async addJob(
    type: string,
    data: any,
    options: {
      priority?: number
      delay?: number
      maxAttempts?: number
    } = {}
  ): Promise<string> {
    try {
      const {
        priority = 0,
        delay = 0,
        maxAttempts = 3
      } = options

      const scheduledFor = new Date(Date.now() + delay)

      const job = await prisma.jobQueue.create({
        data: {
          type,
          data: JSON.stringify(data),
          priority,
          maxAttempts,
          scheduledFor,
          status: 'pending'
        }
      })

      Logger.info('Job added to queue', {
        jobId: job.id,
        type,
        priority,
        scheduledFor
      })

      return job.id
    } catch (error) {
      Logger.error('Failed to add job to queue', error as Error, {
        type,
        data: JSON.stringify(data).substring(0, 200)
      })
      throw error
    }
  }

  // Process queue (should be run by a cron job or worker)
  static async processQueue(): Promise<void> {
    try {
      // Get pending jobs ordered by priority and scheduled time
      const jobs = await prisma.jobQueue.findMany({
        where: {
          status: 'pending',
          scheduledFor: { lte: new Date() }
        },
        orderBy: [
          { priority: 'desc' },
          { scheduledFor: 'asc' }
        ],
        take: 10 // Process 10 jobs at a time
      })

      Logger.info(`Processing ${jobs.length} jobs from queue`)

      for (const job of jobs) {
        await this.processJob(job)
      }
    } catch (error) {
      Logger.error('Queue processing failed', error as Error)
    }
  }

  // Process individual job
  private static async processJob(job: any): Promise<void> {
    try {
      // Update job status to processing
      await prisma.jobQueue.update({
        where: { id: job.id },
        data: {
          status: 'processing',
          updatedAt: new Date()
        }
      })

      // Parse job data
      const data = JSON.parse(job.data)

      // Process based on job type
      let result
      switch (job.type) {
        case 'send_email':
          result = await this.processEmailJob(data)
          break
        case 'process_backup':
          result = await this.processBackupJob(data)
          break
        case 'cleanup_files':
          result = await this.processCleanupJob(data)
          break
        case 'generate_report':
          result = await this.processReportJob(data)
          break
        default:
          throw new Error(`Unknown job type: ${job.type}`)
      }

      // Mark job as completed
      await prisma.jobQueue.update({
        where: { id: job.id },
        data: {
          status: 'completed',
          updatedAt: new Date()
        }
      })

      Logger.info('Job completed successfully', {
        jobId: job.id,
        type: job.type
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Update job with failure
      await prisma.jobQueue.update({
        where: { id: job.id },
        data: {
          status: 'failed',
          error: errorMessage,
          attempts: { increment: 1 },
          updatedAt: new Date()
        }
      })

      Logger.error('Job processing failed', error as Error, {
        jobId: job.id,
        type: job.type,
        attempts: job.attempts + 1,
        maxAttempts: job.maxAttempts
      })

      // If job has exceeded max attempts, mark as permanently failed
      if (job.attempts + 1 >= job.maxAttempts) {
        await prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            error: `Job failed after ${job.maxAttempts} attempts: ${errorMessage}`
          }
        })
      }
    }
  }

  // Process email jobs
  private static async processEmailJob(data: {
    to: string
    subject: string
    html: string
    template?: { subject: string; html: string }
  }): Promise<void> {
    const success = await EmailService.sendEmail(data.to, {
      subject: data.subject,
      html: data.html
    })

    if (!success) {
      throw new Error('Failed to send email')
    }
  }

  // Process backup jobs
  private static async processBackupJob(data: {
    type: 'manual' | 'scheduled'
    userId?: string
  }): Promise<void> {
    // Import here to avoid circular dependency
    const { createManualBackup } = await import('./backup')

    const result = await createManualBackup()

    if (!result.success) {
      throw new Error(result.error || 'Backup failed')
    }
  }

  // Process file cleanup jobs
  private static async processCleanupJob(data: {
    files: string[]
    type: 'temp' | 'orphaned' | 'old'
  }): Promise<void> {
    // Import here to avoid circular dependency
    const { CloudinaryService } = await import('./cloudinary')

    if (data.files.length > 0) {
      await CloudinaryService.deleteFiles(data.files)
    }
  }

  // Process report generation jobs
  private static async processReportJob(data: {
    reportType: 'user_activity' | 'job_analytics' | 'system_health'
    dateRange: { start: Date; end: Date }
  }): Promise<void> {
    // Generate report based on type
    switch (data.reportType) {
      case 'user_activity':
        await this.generateUserActivityReport(data.dateRange)
        break
      case 'job_analytics':
        await this.generateJobAnalyticsReport(data.dateRange)
        break
      case 'system_health':
        await this.generateSystemHealthReport(data.dateRange)
        break
    }
  }

  // Generate user activity report
  private static async generateUserActivityReport(dateRange: { start: Date; end: Date }): Promise<void> {
    const [
      newUsers,
      activeUsers,
      totalLogins,
      postsCreated,
      connectionsMade,
      messagesSent
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      }),
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      }),
      prisma.session.count({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      }),
      prisma.post.count({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      }),
      prisma.connection.count({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      }),
      prisma.message.count({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      })
    ])

    // In a real implementation, you'd save this report to a file or database
    Logger.info('User activity report generated', {
      dateRange,
      metrics: {
        newUsers,
        activeUsers,
        totalLogins,
        postsCreated,
        connectionsMade,
        messagesSent
      }
    })
  }

  // Generate job analytics report
  private static async generateJobAnalyticsReport(dateRange: { start: Date; end: Date }): Promise<void> {
    const [
      jobsPosted,
      applicationsSubmitted,
      jobsFilled,
      topCompanies,
      topLocations
    ] = await Promise.all([
      prisma.job.count({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      }),
      prisma.application.count({
        where: {
          appliedAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        }
      }),
      prisma.application.count({
        where: {
          appliedAt: {
            gte: dateRange.start,
            lte: dateRange.end
          },
          status: 'ACCEPTED'
        }
      }),
      prisma.job.groupBy({
        by: ['company'],
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        _count: true,
        orderBy: {
          _count: {
            company: 'desc'
          }
        },
        take: 10
      }),
      prisma.job.groupBy({
        by: ['location'],
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          }
        },
        _count: true,
        orderBy: {
          _count: {
            location: 'desc'
          }
        },
        take: 10
      })
    ])

    Logger.info('Job analytics report generated', {
      dateRange,
      metrics: {
        jobsPosted,
        applicationsSubmitted,
        jobsFilled,
        topCompanies: topCompanies.slice(0, 5),
        topLocations: topLocations.slice(0, 5)
      }
    })
  }

  // Generate system health report
  private static async generateSystemHealthReport(dateRange: { start: Date; end: Date }): Promise<void> {
    const [
      errorCount,
      backupSuccessRate,
      averageResponseTime,
      systemUptime
    ] = await Promise.all([
      prisma.backupLog.count({
        where: {
          createdAt: {
            gte: dateRange.start,
            lte: dateRange.end
          },
          status: 'FAILED'
        }
      }),
      // Calculate backup success rate
      async () => {
        const totalBackups = await prisma.backupLog.count({
          where: {
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end
            }
          }
        })
        const failedBackups = await prisma.backupLog.count({
          where: {
            createdAt: {
              gte: dateRange.start,
              lte: dateRange.end
            },
            status: 'FAILED'
          }
        })
        return totalBackups > 0 ? ((totalBackups - failedBackups) / totalBackups) * 100 : 100
      },
      // Mock average response time (in real app, you'd measure this)
      Promise.resolve(150), // ms
      // Mock uptime percentage
      Promise.resolve(99.9)
    ])

    Logger.info('System health report generated', {
      dateRange,
      metrics: {
        errorCount,
        backupSuccessRate,
        averageResponseTime,
        systemUptime
      }
    })
  }

  // Get queue statistics
  static async getQueueStats(): Promise<{
    pending: number
    processing: number
    completed: number
    failed: number
    oldestPendingJob?: Date
  }> {
    try {
      const [
        pending,
        processing,
        completed,
        failed,
        oldestJob
      ] = await Promise.all([
        prisma.jobQueue.count({ where: { status: 'pending' } }),
        prisma.jobQueue.count({ where: { status: 'processing' } }),
        prisma.jobQueue.count({ where: { status: 'completed' } }),
        prisma.jobQueue.count({ where: { status: 'failed' } }),
        prisma.jobQueue.findFirst({
          where: { status: 'pending' },
          orderBy: { scheduledFor: 'asc' },
          select: { scheduledFor: true }
        })
      ])

      return {
        pending,
        processing,
        completed,
        failed,
        oldestPendingJob: oldestJob?.scheduledFor
      }
    } catch (error) {
      Logger.error('Failed to get queue stats', error as Error)
      throw error
    }
  }

  // Retry failed jobs
  static async retryFailedJobs(maxRetries: number = 5): Promise<number> {
    try {
      const failedJobs = await prisma.jobQueue.findMany({
        where: {
          status: 'failed',
          attempts: { lt: maxRetries }
        },
        take: 50
      })

      let retriedCount = 0

      for (const job of failedJobs) {
        await prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: 'pending',
            error: null,
            updatedAt: new Date()
          }
        })
        retriedCount++
      }

      Logger.info(`Retried ${retriedCount} failed jobs`)

      return retriedCount
    } catch (error) {
      Logger.error('Failed to retry jobs', error as Error)
      throw error
    }
  }

  // Clean up old completed jobs
  static async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const result = await prisma.jobQueue.deleteMany({
        where: {
          status: 'completed',
          updatedAt: { lt: cutoffDate }
        }
      })

      Logger.info(`Cleaned up ${result.count} old completed jobs`)

      return result.count
    } catch (error) {
      Logger.error('Failed to cleanup old jobs', error as Error)
      throw error
    }
  }
}

// Convenience functions for common job types
export class JobQueue {
  static async sendEmail(
    to: string,
    template: { subject: string; html: string },
    delay: number = 0
  ): Promise<string> {
    return QueueService.addJob('send_email', { to, ...template }, {
      priority: 1,
      delay
    })
  }

  static async createBackup(userId?: string): Promise<string> {
    return QueueService.addJob('process_backup', { type: 'manual', userId }, {
      priority: 2
    })
  }

  static async cleanupFiles(files: string[], type: string = 'temp'): Promise<string> {
    return QueueService.addJob('cleanup_files', { files, type }, {
      priority: 0,
      delay: 300000 // 5 minutes delay
    })
  }

  static async generateReport(
    reportType: string,
    dateRange: { start: Date; end: Date }
  ): Promise<string> {
    return QueueService.addJob('generate_report', { reportType, dateRange }, {
      priority: 1,
      delay: 60000 // 1 minute delay
    })
  }
}
