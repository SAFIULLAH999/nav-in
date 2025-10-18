import { prisma } from '@/lib/prisma'

export interface QueueJob {
  id: string
  type: string
  data: string
  priority: number
  attempts: number
  maxAttempts: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  scheduledFor: Date
  error?: string
  createdAt: Date
  updatedAt: Date
}

export class JobQueueManager {
  // Add a job to the queue
  async addJob(jobData: {
    type: string
    data: string
    priority?: number
    maxAttempts?: number
    scheduledFor?: Date
  }): Promise<string> {
    try {
      const job = await prisma.jobQueue.create({
        data: {
          type: jobData.type,
          data: jobData.data,
          priority: jobData.priority || 0,
          maxAttempts: jobData.maxAttempts || 3,
          scheduledFor: jobData.scheduledFor || new Date()
        }
      })

      console.log(`Added job ${job.id} of type ${jobData.type} to queue`)
      return job.id
    } catch (error) {
      console.error('Error adding job to queue:', error)
      throw error
    }
  }

  // Get the next job to process
  async getNextJob(): Promise<QueueJob | null> {
    try {
      const job = await prisma.jobQueue.findFirst({
        where: {
          status: 'PENDING',
          scheduledFor: {
            lte: new Date()
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ]
      })

      if (job) {
        // Mark as processing
        await prisma.jobQueue.update({
          where: { id: job.id },
          data: {
            status: 'PROCESSING',
            attempts: { increment: 1 }
          }
        })

        return {
          id: job.id,
          type: job.type,
          data: job.data,
          priority: job.priority,
          attempts: job.attempts + 1,
          maxAttempts: job.maxAttempts,
          status: 'processing',
          scheduledFor: job.scheduledFor,
          error: job.error || undefined,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt
        }
      }

      return null
    } catch (error) {
      console.error('Error getting next job:', error)
      return null
    }
  }

  // Update job status
  async updateJobStatus(
    jobId: string,
    status: 'completed' | 'failed',
    additionalData?: { error?: string; [key: string]: any }
  ): Promise<void> {
    try {
      await prisma.jobQueue.update({
        where: { id: jobId },
        data: {
          status: status.toUpperCase(),
          error: additionalData?.error || null,
          ...(additionalData && { data: JSON.stringify({ ...JSON.parse(additionalData.data || '{}'), ...additionalData }) })
        }
      })

      console.log(`Updated job ${jobId} status to ${status}`)
    } catch (error) {
      console.error(`Error updating job ${jobId} status:`, error)
    }
  }

  // Get queue statistics
  async getQueueStats(): Promise<{
    pending: number
    processing: number
    completed: number
    failed: number
    total: number
  }> {
    try {
      const stats = await prisma.jobQueue.groupBy({
        by: ['status'],
        _count: true
      })

      const result = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        total: 0
      }

      stats.forEach(stat => {
        const count = stat._count
        result.total += count

        switch (stat.status?.toLowerCase()) {
          case 'pending':
            result.pending = count
            break
          case 'processing':
            result.processing = count
            break
          case 'completed':
            result.completed = count
            break
          case 'failed':
            result.failed = count
            break
        }
      })

      return result
    } catch (error) {
      console.error('Error getting queue stats:', error)
      return { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 }
    }
  }

  // Clean up old completed/failed jobs
  async cleanupOldJobs(daysOld: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)

      const result = await prisma.jobQueue.deleteMany({
        where: {
          status: { in: ['COMPLETED', 'FAILED'] },
          updatedAt: { lt: cutoffDate }
        }
      })

      console.log(`Cleaned up ${result.count} old jobs`)
      return result.count
    } catch (error) {
      console.error('Error cleaning up old jobs:', error)
      return 0
    }
  }

  // Get jobs by type
  async getJobsByType(type: string, limit: number = 50): Promise<QueueJob[]> {
    try {
      const jobs = await prisma.jobQueue.findMany({
        where: { type },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return jobs.map(job => ({
        id: job.id,
        type: job.type,
        data: job.data,
        priority: job.priority,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        status: job.status.toLowerCase() as any,
        scheduledFor: job.scheduledFor,
        error: job.error || undefined,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      }))
    } catch (error) {
      console.error('Error getting jobs by type:', error)
      return []
    }
  }
}