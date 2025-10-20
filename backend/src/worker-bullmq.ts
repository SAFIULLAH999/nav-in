#!/usr/bin/env tsx

import { jobWorker, jobQueue, getQueueStats } from './services/queue';
import { redisService } from './services/redis';
import { logger } from './utils/logger';

/**
 * BullMQ Worker Process
 *
 * This script starts a BullMQ worker that processes jobs from Redis queues.
 * It's designed for high-throughput scenarios with Redis-backed job processing.
 *
 * Usage:
 *   npm run worker:bull          # Development
 *   npm run worker:bull:prod     # Production
 */

async function startBullMQWorker() {
  logger.info('🚀 Starting BullMQ Worker...');

  try {
    // Test Redis connection
    await redisService.ping();
    logger.info('✅ Redis connected successfully');

    // Log worker configuration
    logger.info('📊 BullMQ Worker Configuration:');
    logger.info(`   Concurrency: ${process.env.QUEUE_CONCURRENCY || '5'}`);
    logger.info(`   Retry Attempts: ${process.env.JOB_RETRY_ATTEMPTS || '3'}`);

    // Start the worker
    logger.info('✅ BullMQ Worker started successfully');
    logger.info('📋 Worker is listening for jobs...');
    logger.info('🔄 Press Ctrl+C to stop the worker');

    // Setup periodic stats logging
    const statsInterval = setInterval(async () => {
      try {
        const stats = await getQueueStats();
        logger.info('📊 Queue Stats:', stats);
      } catch (error) {
        logger.error('Error getting queue stats:', error);
      }
    }, 60000); // Log stats every minute

    // Keep the process alive
    process.stdin.resume();

    // Handle graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`⏹️  Received ${signal}, shutting down BullMQ worker...`);

      clearInterval(statsInterval);

      try {
        await jobWorker.close();
        await jobQueue.close();
        logger.info('✅ BullMQ worker closed successfully');
      } catch (error) {
        logger.error('❌ Error closing BullMQ worker:', error);
      }

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Failed to start BullMQ Worker:', error);
    process.exit(1);
  }
}

// Handle worker events for monitoring
jobWorker.on('completed', (job) => {
  logger.info(`✅ Job ${job.id} completed successfully`);
});

jobWorker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed:`, err.message);
});

jobWorker.on('error', (error) => {
  logger.error('❌ Worker error:', error);
});

jobWorker.on('waiting', (jobId) => {
  logger.debug(`⏳ Job ${jobId} is waiting`);
});

jobWorker.on('active', (job) => {
  logger.debug(`🔄 Job ${job.id} is now active`);
});

jobWorker.on('stalled', (jobId) => {
  logger.warn(`⚠️  Job ${jobId} has stalled`);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  jobWorker.close().finally(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  jobWorker.close().finally(() => process.exit(1));
});

// Start the worker if this file is run directly
if (require.main === module) {
  startBullMQWorker();
}

export { startBullMQWorker };
