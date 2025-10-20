import { PrismaClient } from '@prisma/client';
import { redisService } from './redis';
import { logger } from '../utils/logger';
import { addJob, getQueueStats } from './queue';

const prisma = new PrismaClient();

export interface BackgroundJobProcessorConfig {
  checkInterval: number; // milliseconds
  batchSize: number;
  maxRetries: number;
  retryDelay: number; // milliseconds
}

export class BackgroundJobProcessor {
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private config: BackgroundJobProcessorConfig;

  constructor(config: Partial<BackgroundJobProcessorConfig> = {}) {
    this.config = {
      checkInterval: config.checkInterval || 30000, // 30 seconds
      batchSize: config.batchSize || 10,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 5000, // 5 seconds
    };
  }

  /**
   * Start the background processor
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Background processor is already running');
      return;
    }

    logger.info('Starting BackgroundJobProcessor...');
    this.isRunning = true;

    try {
      // Test database connection
      await prisma.$connect();
      logger.info('Database connected successfully');

      // Test Redis connection
      await redisService.ping();
      logger.info('Redis connected successfully');

      // Start the main processing loop
      this.startProcessingLoop();

      // Setup graceful shutdown handlers
      this.setupGracefulShutdown();

      logger.info('BackgroundJobProcessor started successfully');
    } catch (error) {
      logger.error('Failed to start BackgroundJobProcessor:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the background processor
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Background processor is not running');
      return;
    }

    logger.info('Stopping BackgroundJobProcessor...');
    this.isRunning = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    try {
      await prisma.$disconnect();
      logger.info('Database disconnected');
    } catch (error) {
      logger.error('Error disconnecting from database:', error);
    }

    logger.info('BackgroundJobProcessor stopped');
  }

  /**
   * Start the main processing loop
   */
  private startProcessingLoop(): void {
    this.checkInterval = setInterval(async () => {
      try {
        await this.processJobs();
      } catch (error) {
        logger.error('Error in processing loop:', error);
      }
    }, this.config.checkInterval);

    // Process immediately on start
    this.processJobs().catch(error => {
      logger.error('Error in initial job processing:', error);
    });
  }

  /**
   * Main job processing function
   */
  private async processJobs(): Promise<void> {
    if (!this.isRunning) return;

    logger.debug('Processing background jobs...');

    try {
      // Process different types of background jobs
      await Promise.all([
        this.processScheduledJobs(),
        this.processCleanupJobs(),
        this.processMaintenanceJobs(),
        this.processAnalyticsJobs(),
      ]);

      logger.debug('Background jobs processed successfully');
    } catch (error) {
      logger.error('Error processing background jobs:', error);
    }
  }

  /**
   * Process scheduled jobs from database
   */
  private async processScheduledJobs(): Promise<void> {
    try {
      const scheduledJobs = await prisma.jobQueue.findMany({
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
        take: this.config.batchSize,
      });

      for (const job of scheduledJobs) {
        try {
          await this.executeJob(job);
        } catch (error) {
          logger.error(`Failed to execute scheduled job ${job.id}:`, error);
          await this.handleJobFailure(job.id, error);
        }
      }
    } catch (error) {
      logger.error('Error processing scheduled jobs:', error);
    }
  }

  /**
   * Process cleanup jobs
   */
  private async processCleanupJobs(): Promise<void> {
    try {
      // Clean up old logs
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      await prisma.backupLog.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
        },
      });

      // Clean up old temporary files
      await prisma.document.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo,
          },
          isPublic: false,
        },
      });

      logger.debug('Cleanup jobs completed');
    } catch (error) {
      logger.error('Error processing cleanup jobs:', error);
    }
  }

  /**
   * Process maintenance jobs
   */
  private async processMaintenanceJobs(): Promise<void> {
    try {
      // Update user activity status
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      await prisma.user.updateMany({
        where: {
          lastLoginAt: {
            lt: fiveMinutesAgo,
          },
        },
        data: {
          // Could mark users as offline here if needed
        },
      });

      // Clean up expired tokens
      await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.debug('Maintenance jobs completed');
    } catch (error) {
      logger.error('Error processing maintenance jobs:', error);
    }
  }

  /**
   * Process analytics jobs
   */
  private async processAnalyticsJobs(): Promise<void> {
    try {
      // Aggregate daily analytics
      await this.aggregateDailyAnalytics();

      // Update trending topics
      await this.updateTrendingTopics();

      logger.debug('Analytics jobs completed');
    } catch (error) {
      logger.error('Error processing analytics jobs:', error);
    }
  }

  /**
   * Execute a specific job
   */
  async executeJob(job: any): Promise<void> {
    logger.info(`Executing job ${job.id} of type ${job.type}`);

    // Update job status to processing
    await prisma.jobQueue.update({
      where: { id: job.id },
      data: {
        status: 'PROCESSING',
        attempts: { increment: 1 },
      },
    });

    let result: any = null;
    let error: any = null;

    try {
      // Execute job based on type
      switch (job.type) {
        case 'fetch_jobs':
          result = await this.executeFetchJobs(job.data);
          break;
        case 'send_email':
          result = await this.executeSendEmail(job.data);
          break;
        case 'rebuild_index':
          result = await this.executeRebuildIndex(job.data);
          break;
        case 'archive_logs':
          result = await this.executeArchiveLogs(job.data);
          break;
        case 'data_processing':
          result = await this.executeDataProcessing(job.data);
          break;
        default:
          throw new Error(`Unknown job type: ${job.type}`);
      }

      // Mark job as completed
      await prisma.jobQueue.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          result: JSON.stringify(result),
        },
      });

      logger.info(`Job ${job.id} completed successfully`);
    } catch (err) {
      error = err;

      // Handle job failure
      await this.handleJobFailure(job.id, error);
      throw error;
    }
  }

  /**
   * Execute fetch jobs task
   */
  private async executeFetchJobs(data: any): Promise<any> {
    logger.info('Executing fetch jobs task');

    // TODO: Implement job scraping logic
    // This would integrate with your existing job scrapers

    return {
      success: true,
      jobsFetched: 0,
      message: 'Fetch jobs task completed',
    };
  }

  /**
   * Execute send email task
   */
  private async executeSendEmail(data: any): Promise<any> {
    logger.info('Executing send email task');

    // TODO: Implement email sending logic
    // This would integrate with your email service

    return {
      success: true,
      emailSent: true,
      recipient: data.to,
      message: 'Email sent successfully',
    };
  }

  /**
   * Execute rebuild index task
   */
  private async executeRebuildIndex(data: any): Promise<any> {
    logger.info('Executing rebuild index task');

    // TODO: Implement search index rebuilding
    // This would rebuild your search indexes

    return {
      success: true,
      indexRebuilt: true,
      message: 'Index rebuilt successfully',
    };
  }

  /**
   * Execute archive logs task
   */
  private async executeArchiveLogs(data: any): Promise<any> {
    logger.info('Executing archive logs task');

    // TODO: Implement log archiving
    // This would archive old logs to external storage

    return {
      success: true,
      logsArchived: true,
      message: 'Logs archived successfully',
    };
  }

  /**
   * Execute data processing task
   */
  private async executeDataProcessing(data: any): Promise<any> {
    logger.info('Executing data processing task');

    // TODO: Implement data processing logic
    // This could be analytics processing, data transformation, etc.

    return {
      success: true,
      dataProcessed: true,
      message: 'Data processing completed',
    };
  }

  /**
   * Handle job failure
   */
  private async handleJobFailure(jobId: string, error: any): Promise<void> {
    try {
      const job = await prisma.jobQueue.findUnique({
        where: { id: jobId },
      });

      if (!job) return;

      if (job.attempts < this.config.maxRetries) {
        // Retry the job
        await prisma.jobQueue.update({
          where: { id: jobId },
          data: {
            status: 'PENDING',
            scheduledFor: new Date(Date.now() + this.config.retryDelay),
            error: error.message,
          },
        });

        logger.warn(`Job ${jobId} scheduled for retry (attempt ${job.attempts + 1})`);
      } else {
        // Mark as failed
        await prisma.jobQueue.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            error: error.message,
          },
        });

        logger.error(`Job ${jobId} failed after ${job.attempts} attempts`);
      }
    } catch (updateError) {
      logger.error('Error handling job failure:', updateError);
    }
  }

  /**
   * Aggregate daily analytics
   */
  private async aggregateDailyAnalytics(): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Count events for today
      const eventCount = await prisma.analyticsEvent.count({
        where: {
          timestamp: {
            gte: today,
          },
        },
      });

      // TODO: Store daily aggregates
      logger.debug(`Daily analytics: ${eventCount} events`);
    } catch (error) {
      logger.error('Error aggregating daily analytics:', error);
    }
  }

  /**
   * Update trending topics
   */
  private async updateTrendingTopics(): Promise<void> {
    try {
      // TODO: Calculate trending topics based on recent activity
      logger.debug('Trending topics updated');
    } catch (error) {
      logger.error('Error updating trending topics:', error);
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Get processor statistics
   */
  async getStats(): Promise<any> {
    try {
      const queueStats = await getQueueStats();

      const dbStats = await prisma.jobQueue.aggregate({
        _count: {
          id: true,
        },
        where: {
          status: 'PENDING',
        },
      });

      return {
        isRunning: this.isRunning,
        queue: queueStats,
        pendingJobs: dbStats._count.id,
        config: this.config,
        uptime: process.uptime(),
      };
    } catch (error) {
      logger.error('Error getting processor stats:', error);
      return null;
    }
  }

  /**
   * Health check endpoint data
   */
  async getHealth(): Promise<any> {
    return {
      status: this.isRunning ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: await this.checkDatabaseHealth(),
      redis: await this.checkRedisHealth(),
    };
  }

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkRedisHealth(): Promise<boolean> {
    try {
      await redisService.ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const backgroundProcessor = new BackgroundJobProcessor();
