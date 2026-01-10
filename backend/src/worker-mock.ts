#!/usr/bin/env tsx

import { mockJobQueue, mockJobWorker, mockJobQueueManager } from './services/queue-mock';
import { mockRedisService } from './services/redis-mock';
import { logger } from './utils/logger';

/**
 * Mock Worker Process
 *
 * This script starts a mock worker that simulates BullMQ job processing
 * for testing purposes when Redis server is not available.
 *
 * Usage:
 *   npm run worker:mock          # Development
 *   npm run worker:mock:prod     # Production
 */

async function startMockWorker() {
  logger.info('🎭 Starting Mock Worker...');

  try {
    // Test mock Redis connection
    await mockRedisService.ping();
    logger.info('✅ Mock Redis connected successfully');

    // Log worker configuration
    logger.info('📊 Mock Worker Configuration:');
    logger.info('   Concurrency: 5');
    logger.info('   Retry Attempts: 3');

    // Start the worker
    logger.info('✅ Mock Worker started successfully');
    logger.info('📋 Worker is listening for jobs...');
    logger.info('🔄 Press Ctrl+C to stop the worker');

    // Setup periodic stats logging
    const statsInterval = setInterval(async () => {
      try {
        const stats = await mockJobQueueManager.getQueueStats();
        logger.info('📊 Queue Stats:', stats);
      } catch (error) {
        logger.error('Error getting queue stats:', error);
      }
    }, 60000); // Log stats every minute

    // Keep the process alive
    process.stdin.resume();

    // Handle graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`⏹️  Received ${signal}, shutting down Mock worker...`);

      clearInterval(statsInterval);

      try {
        await mockJobWorker.close();
        await mockJobQueue.close();
        logger.info('✅ Mock worker closed successfully');
      } catch (error) {
        logger.error('❌ Error closing Mock worker:', error);
      }

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Failed to start Mock Worker:', error);
    process.exit(1);
  }
}

// Handle worker events for monitoring
mockJobWorker.on('completed', (job) => {
  logger.info(`✅ Job ${job.id} completed successfully`);
});

mockJobWorker.on('failed', (job, err) => {
  logger.error(`❌ Job ${job?.id} failed:`, err.message);
});

mockJobWorker.on('error', (error) => {
  logger.error('❌ Worker error:', error);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  mockJobWorker.close().finally(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  mockJobWorker.close().finally(() => process.exit(1));
});

// Start the worker if this file is run directly
if (require.main === module) {
  startMockWorker();
}

export { startMockWorker };
