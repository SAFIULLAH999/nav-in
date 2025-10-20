import { PrismaClient } from '@prisma/client';
import { backgroundProcessor } from './background-processor';
import { addJob } from './queue';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface JobQueueManagerConfig {
  maxRetries: number;
  retryDelay: number;
  priorityLevels: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    URGENT: number;
  };
}

export class JobQueueManager {
  private config: JobQueueManagerConfig;

  constructor(config: Partial<JobQueueManagerConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5000,
      priorityLevels: {
        LOW: 1,
        MEDIUM: 5,
        HIGH: 8,
        URGENT: 10,
        ...config.priorityLevels,
      },
    };
  }

  /**
   * Schedule a job for execution
   */
  async scheduleJob(
    type: string,
    data: any,
    options: {
      priority?: keyof JobQueueManagerConfig['priorityLevels'];
      delay?: number;
      scheduledFor?: Date;
    } = {}
  ): Promise<string> {
    try {
      const priority = options.priority
        ? this.config.priorityLevels[options.priority]
        : this.config.priorityLevels.MEDIUM;

      const job = await prisma.jobQueue.create({
        data: {
          type,
          data: JSON.stringify(data),
          priority,
          status: 'PENDING',
          scheduledFor: options.scheduledFor || new Date(),
          maxAttempts: this.config.maxRetries,
        },
      });

      logger.info(`Scheduled job ${job.id} of type ${type} with priority ${priority}`);

      // If no delay, try to process immediately
      if (!options.delay && !options.scheduledFor) {
        this.processJobImmediately(job.id).catch(error => {
          logger.error(`Failed to process job ${job.id} immediately:`, error);
        });
      }

      return job.id;
    } catch (error) {
      logger.error('Failed to schedule job:', error);
      throw error;
    }
  }

  /**
   * Schedule a job to fetch jobs from external sources
   */
  async scheduleFetchJobs(data: {
    source?: string;
    keywords?: string[];
    location?: string;
    limit?: number;
  } = {}): Promise<string> {
    return this.scheduleJob('fetch_jobs', data, {
      priority: 'HIGH',
    });
  }

  /**
   * Schedule an email sending job
   */
  async scheduleEmailJob(data: {
    to: string;
    subject: string;
    template?: string;
    variables?: Record<string, any>;
  }): Promise<string> {
    return this.scheduleJob('send_email', data, {
      priority: 'MEDIUM',
    });
  }

  /**
   * Schedule a search index rebuild job
   */
  async scheduleRebuildIndex(data: {
    type: 'users' | 'jobs' | 'posts' | 'all';
    incremental?: boolean;
  } = { type: 'all' }): Promise<string> {
    return this.scheduleJob('rebuild_index', data, {
      priority: 'HIGH',
    });
  }

  /**
   * Schedule a log archival job
   */
  async scheduleArchiveLogs(data: {
    olderThan?: number; // days
    archiveType?: 'compress' | 'delete' | 'move';
  } = {}): Promise<string> {
    return this.scheduleJob('archive_logs', data, {
      priority: 'LOW',
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000), // Run daily
    });
  }

  /**
   * Schedule a data processing job
   */
  async scheduleDataProcessing(data: {
    operation: string;
    parameters?: Record<string, any>;
  }): Promise<string> {
    return this.scheduleJob('data_processing', data, {
      priority: 'MEDIUM',
    });
  }

  /**
   * Get job statistics
   */
  async getJobStats(): Promise<any> {
    try {
      const stats = await prisma.jobQueue.groupBy({
        by: ['status', 'type'],
        _count: {
          id: true,
        },
        _avg: {
          priority: true,
        },
      });

      const totalJobs = await prisma.jobQueue.count();

      return {
        total: totalJobs,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat.status] = (acc[stat.status] || 0) + stat._count.id;
          return acc;
        }, {} as Record<string, number>),
        byType: stats.reduce((acc, stat) => {
          if (!acc[stat.type]) {
            acc[stat.type] = { count: 0, avgPriority: 0 };
          }
          acc[stat.type].count += stat._count.id;
          acc[stat.type].avgPriority = stat._avg.priority || 0;
          return acc;
        }, {} as Record<string, any>),
      };
    } catch (error) {
      logger.error('Error getting job stats:', error);
      throw error;
    }
  }

  /**
   * Get pending jobs
   */
  async getPendingJobs(limit: number = 50): Promise<any[]> {
    try {
      return await prisma.jobQueue.findMany({
        where: {
          status: 'PENDING',
          scheduledFor: {
            lte: new Date(),
          },
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' },
        ],
        take: limit,
      });
    } catch (error) {
      logger.error('Error getting pending jobs:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    try {
      const result = await prisma.jobQueue.updateMany({
        where: {
          id: jobId,
          status: {
            in: ['PENDING', 'PROCESSING'],
          },
        },
        data: {
          status: 'CANCELLED',
        },
      });

      return result.count > 0;
    } catch (error) {
      logger.error(`Error cancelling job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<boolean> {
    try {
      const result = await prisma.jobQueue.updateMany({
        where: {
          id: jobId,
          status: 'FAILED',
        },
        data: {
          status: 'PENDING',
          attempts: 0,
          scheduledFor: new Date(),
          error: null,
        },
      });

      return result.count > 0;
    } catch (error) {
      logger.error(`Error retrying job ${jobId}:`, error);
      return false;
    }
  }

  /**
   * Process a job immediately (bypass scheduling)
   */
  private async processJobImmediately(jobId: string): Promise<void> {
    try {
      const job = await prisma.jobQueue.findUnique({
        where: { id: jobId },
      });

      if (!job || job.status !== 'PENDING') {
        return;
      }

      // Execute the job using the background processor
      await backgroundProcessor.executeJob(job);

      logger.info(`Job ${jobId} processed immediately`);
    } catch (error) {
      logger.error(`Failed to process job ${jobId} immediately:`, error);
    }
  }

  /**
   * Clean up old completed/failed jobs
   */
  async cleanupOldJobs(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await prisma.jobQueue.deleteMany({
        where: {
          status: {
            in: ['COMPLETED', 'FAILED', 'CANCELLED'],
          },
          updatedAt: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up ${result.count} old jobs`);
      return result.count;
    } catch (error) {
      logger.error('Error cleaning up old jobs:', error);
      return 0;
    }
  }

  /**
   * Get job by ID
   */
  async getJob(jobId: string): Promise<any | null> {
    try {
      return await prisma.jobQueue.findUnique({
        where: { id: jobId },
      });
    } catch (error) {
      logger.error(`Error getting job ${jobId}:`, error);
      return null;
    }
  }

  /**
   * Update job priority
   */
  async updateJobPriority(jobId: string, priority: keyof JobQueueManagerConfig['priorityLevels']): Promise<boolean> {
    try {
      const result = await prisma.jobQueue.updateMany({
        where: { id: jobId },
        data: {
          priority: this.config.priorityLevels[priority],
        },
      });

      return result.count > 0;
    } catch (error) {
      logger.error(`Error updating job ${jobId} priority:`, error);
      return false;
    }
  }
}

// Export singleton instance
export const jobQueueManager = new JobQueueManager();
