#!/usr/bin/env tsx

import { backgroundProcessor } from './services/background-processor';
import { enhancedScraperManager } from './services/enhanced-scraper-manager';
import { jobQueueManager } from './services/job-queue-manager';
import { logger } from './utils/logger';

/**
 * Main Worker Service
 *
 * This is the primary worker that runs 24/7 and handles:
 * - Background job processing
 * - Job scraping from external sources
 * - Queue management
 * - Health monitoring
 *
 * Usage:
 *   npm run worker          # Development
 *   npm run worker:prod     # Production
 */

class WorkerService {
  private isShuttingDown: boolean = false;

  async start(): Promise<void> {
    logger.info('🚀 Starting NavIN Worker Service...');

    const startedServices: string[] = [];

    try {
      // Start background job processor
      try {
        await backgroundProcessor.start();
        logger.info('✅ BackgroundJobProcessor started');
        startedServices.push('BackgroundJobProcessor');
      } catch (error) {
        logger.warn('⚠️ BackgroundJobProcessor failed to start, continuing without it:', error instanceof Error ? error.message : String(error));
      }

      // Start enhanced scraper manager
      try {
        await enhancedScraperManager.start();
        logger.info('✅ EnhancedJobScraperManager started');
        startedServices.push('EnhancedJobScraperManager');
      } catch (error) {
        logger.warn('⚠️ EnhancedJobScraperManager failed to start, continuing without it:', error instanceof Error ? error.message : String(error));
      }

      // Setup health check endpoint
      this.setupHealthCheckEndpoint();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      if (startedServices.length === 0) {
        logger.error('❌ No services could be started. Worker cannot function without any services.');
        process.exit(1);
      }

      logger.info('🎉 Worker Service started successfully!');
      logger.info('📊 Services running:');
      if (startedServices.includes('BackgroundJobProcessor')) {
        logger.info('   • Background Job Processor (30s intervals)');
      }
      if (startedServices.includes('EnhancedJobScraperManager')) {
        logger.info('   • Enhanced Job Scraper Manager');
      }
      logger.info('   • Queue Management System (degraded mode if Redis unavailable)');
      logger.info('🔄 Press Ctrl+C to stop the worker');

    } catch (error) {
      logger.error('❌ Failed to start Worker Service:', error);
      process.exit(1);
    }
  }

  async stop(): Promise<void> {
    if (this.isShuttingDown) return;

    logger.info('⏹️  Shutting down Worker Service...');
    this.isShuttingDown = true;

    try {
      // Stop all services
      await Promise.all([
        backgroundProcessor.stop(),
        enhancedScraperManager.stop(),
      ]);

      logger.info('✅ Worker Service stopped successfully');
    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
    }
  }

  private setupHealthCheckEndpoint(): void {
    // Simple health check endpoint for monitoring
    process.on('message', async (message) => {
      if (message === 'health_check') {
        try {
          const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            backgroundProcessor: await backgroundProcessor.getHealth(),
            memory: process.memoryUsage(),
          };

          if (process.send) {
            process.send(health);
          }
        } catch (error) {
          logger.error('Health check failed:', error);
          if (process.send) {
            process.send({ status: 'unhealthy', error: error instanceof Error ? error.message : String(error) });
          }
        }
      }
    });
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`📡 Received ${signal}, shutting down gracefully...`);
      await this.stop();
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => {
      logger.info('🔄 Received SIGUSR2, restarting...');
      this.stop().then(() => this.start()).catch(error => {
        logger.error('❌ Failed to restart:', error);
        process.exit(1);
      });
    });
  }
}

// Start the worker service
async function main() {
  const worker = new WorkerService();

  // Handle uncaught errors
  process.on('uncaughtException', (error) => {
    logger.error('❌ Uncaught Exception:', error);
    worker.stop().finally(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason, promise) => {
    logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    worker.stop().finally(() => process.exit(1));
  });

  await worker.start();
}

// Start if this file is run directly
if (require.main === module) {
  main();
}

export { WorkerService };
