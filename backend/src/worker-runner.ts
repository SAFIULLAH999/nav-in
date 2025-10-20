#!/usr/bin/env tsx

import { backgroundProcessor } from './services/background-processor';
import { logger } from './utils/logger';

/**
 * Background Worker Runner
 *
 * This script starts the BackgroundJobProcessor and runs it continuously.
 * It's designed to be run as a separate service in production environments.
 *
 * Usage:
 *   npm run worker:runner          # Development
 *   npm run worker:runner:prod     # Production
 */

async function startWorker() {
  logger.info('🚀 Starting Background Worker...');

  try {
    // Start the background processor
    await backgroundProcessor.start();

    logger.info('✅ Background Worker started successfully');
    logger.info('📊 Worker will process jobs every 30 seconds');
    logger.info('🔄 Press Ctrl+C to stop the worker');

    // Keep the process alive
    process.stdin.resume();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('⏹️  Received SIGINT, shutting down worker...');
      await backgroundProcessor.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('⏹️  Received SIGTERM, shutting down worker...');
      await backgroundProcessor.stop();
      process.exit(0);
    });

  } catch (error) {
    logger.error('❌ Failed to start Background Worker:', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('❌ Uncaught Exception:', error);
  backgroundProcessor.stop().finally(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  backgroundProcessor.stop().finally(() => process.exit(1));
});

// Start the worker if this file is run directly
if (require.main === module) {
  startWorker();
}

export { startWorker };
