import { PrismaClient } from '@prisma/client';
import { jobQueueManager } from './job-queue-manager';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface ScrapingSource {
  id: string;
  name: string;
  baseUrl: string;
  isActive: boolean;
  rateLimit: number;
  config?: any;
}

export interface ScrapingJob {
  sourceId: string;
  url: string;
  priority: number;
  metadata?: Record<string, any>;
}

export class EnhancedJobScraperManager {
  private isRunning: boolean = false;
  private activeScrapers: Map<string, NodeJS.Timeout> = new Map();
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Start the enhanced scraper manager
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('EnhancedJobScraperManager is already running');
      return;
    }

    logger.info('Starting EnhancedJobScraperManager...');
    this.isRunning = true;

    try {
      // Initialize active scraping sources
      await this.initializeScrapingSources();

      // Start the main scraping loop
      this.startScrapingLoop();

      logger.info('EnhancedJobScraperManager started successfully');
    } catch (error) {
      logger.error('Failed to start EnhancedJobScraperManager:', error);
      this.isRunning = false;
      // Don't throw error - allow worker to continue without scraping
    }
  }

  /**
   * Stop the enhanced scraper manager
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('EnhancedJobScraperManager is not running');
      return;
    }

    logger.info('Stopping EnhancedJobScraperManager...');
    this.isRunning = false;

    // Clear all active scrapers
    for (const [sourceId, interval] of this.activeScrapers) {
      clearInterval(interval);
      logger.debug(`Stopped scraper for source ${sourceId}`);
    }
    this.activeScrapers.clear();

    logger.info('EnhancedJobScraperManager stopped');
  }

  /**
   * Initialize scraping sources and start their intervals
   */
  private async initializeScrapingSources(): Promise<void> {
    try {
      const sources = await prisma.jobSource.findMany({
        where: { isActive: true },
      });

      logger.info(`Initializing ${sources.length} active scraping sources`);

      for (const source of sources) {
        await this.startSourceScraping(source);
      }
    } catch (error) {
      logger.error('Error initializing scraping sources:', error);
    }
  }

  /**
   * Start scraping for a specific source
   */
  private async startSourceScraping(source: ScrapingSource): Promise<void> {
    try {
      // Calculate interval based on rate limit
      const interval = Math.max(60000 / source.rateLimit, 5000); // Minimum 5 seconds

      const scraperInterval = setInterval(async () => {
        try {
          await this.scrapeSource(source);
        } catch (error) {
          logger.error(`Error scraping source ${source.id}:`, error);
        }
      }, interval);

      this.activeScrapers.set(source.id, scraperInterval);
      logger.info(`Started scraper for ${source.name} (interval: ${interval}ms)`);

      // Scrape immediately on start
      this.scrapeSource(source).catch(error => {
        logger.error(`Error in initial scrape for ${source.id}:`, error);
      });
    } catch (error) {
      logger.error(`Failed to start scraper for source ${source.id}:`, error);
    }
  }

  /**
   * Scrape a specific source
   */
  private async scrapeSource(source: ScrapingSource): Promise<void> {
    if (!this.isRunning) return;

    // Check rate limiting
    if (!this.checkRateLimit(source.id, source.rateLimit)) {
      logger.debug(`Rate limit exceeded for source ${source.id}`);
      return;
    }

    logger.info(`Scraping source: ${source.name}`);

    try {
      // Update source last scraped time
      await prisma.jobSource.update({
        where: { id: source.id },
        data: { lastScraped: new Date() },
      });

      // Generate URLs to scrape based on source configuration
      const urlsToScrape = await this.generateScrapingUrls(source);

      // Queue scraping jobs for each URL
      for (const url of urlsToScrape) {
        await this.queueScrapingJob({
          sourceId: source.id,
          url,
          priority: 5,
          metadata: {
            sourceName: source.name,
            scrapedAt: new Date().toISOString(),
          },
        });
      }

      logger.info(`Queued ${urlsToScrape.length} jobs for source ${source.name}`);
    } catch (error) {
      logger.error(`Error scraping source ${source.id}:`, error);
    }
  }

  /**
   * Generate URLs to scrape for a source
   */
  private async generateScrapingUrls(source: ScrapingSource): Promise<string[]> {
    const urls: string[] = [];

    try {
      // This is a simplified URL generation
      // In a real implementation, you would:
      // 1. Use the source's baseUrl and config
      // 2. Generate search URLs based on keywords, locations, etc.
      // 3. Handle pagination
      // 4. Implement incremental scraping to avoid duplicates

      switch (source.name.toLowerCase()) {
        case 'linkedin':
          urls.push(
            `${source.baseUrl}/jobs/search/?keywords=software%20engineer`,
            `${source.baseUrl}/jobs/search/?keywords=frontend%20developer`,
            `${source.baseUrl}/jobs/search/?keywords=backend%20developer`
          );
          break;
        case 'indeed':
          urls.push(
            `${source.baseUrl}/jobs?q=software+engineer`,
            `${source.baseUrl}/jobs?q=frontend+developer`,
            `${source.baseUrl}/jobs?q=backend+developer`
          );
          break;
        default:
          // Generic scraping for other sources
          urls.push(source.baseUrl);
      }

      return urls;
    } catch (error) {
      logger.error(`Error generating URLs for source ${source.id}:`, error);
      return [];
    }
  }

  /**
   * Queue a scraping job
   */
  private async queueScrapingJob(job: ScrapingJob): Promise<void> {
    try {
      await jobQueueManager.scheduleJob('fetch_jobs', {
        sourceId: job.sourceId,
        url: job.url,
        metadata: job.metadata,
      }, {
        priority: job.priority >= 8 ? 'HIGH' : job.priority >= 5 ? 'MEDIUM' : 'LOW',
      });

      // Update source job count
      await prisma.jobSource.update({
        where: { id: job.sourceId },
        data: {
          totalJobs: {
            increment: 1,
          },
        },
      });
    } catch (error) {
      logger.error('Error queueing scraping job:', error);
    }
  }

  /**
   * Check rate limiting for a source
   */
  private checkRateLimit(sourceId: string, rateLimit: number): boolean {
    const now = Date.now();
    const limiter = this.rateLimiters.get(sourceId);

    if (!limiter || now > limiter.resetTime) {
      // Reset rate limiter
      this.rateLimiters.set(sourceId, {
        count: 1,
        resetTime: now + 60000, // 1 minute window
      });
      return true;
    }

    if (limiter.count >= rateLimit) {
      return false;
    }

    limiter.count++;
    return true;
  }

  /**
   * Start scraping loop
   */
  private startScrapingLoop(): void {
    // Check for new sources every 5 minutes
    setInterval(async () => {
      try {
        await this.checkForNewSources();
      } catch (error) {
        logger.error('Error checking for new sources:', error);
      }
    }, 300000); // 5 minutes
  }

  /**
   * Check for new scraping sources
   */
  private async checkForNewSources(): Promise<void> {
    try {
      const newSources = await prisma.jobSource.findMany({
        where: {
          isActive: true,
        },
      });

      for (const source of newSources) {
        if (!this.activeScrapers.has(source.id)) {
          logger.info(`Found new scraping source: ${source.name}`);
          await this.startSourceScraping(source);
        }
      }
    } catch (error) {
      logger.error('Error checking for new sources:', error);
    }
  }

  /**
   * Add a new scraping source
   */
  async addScrapingSource(source: Omit<ScrapingSource, 'id' | 'lastScraped' | 'totalJobs'>): Promise<string> {
    try {
      const newSource = await prisma.jobSource.create({
        data: {
          name: source.name,
          baseUrl: source.baseUrl,
          isActive: source.isActive,
          rateLimit: source.rateLimit,
          config: source.config ? JSON.stringify(source.config) : null,
        },
      });

      logger.info(`Added new scraping source: ${source.name}`);

      // Start scraping for the new source
      if (source.isActive) {
        await this.startSourceScraping(newSource);
      }

      return newSource.id;
    } catch (error) {
      logger.error('Error adding scraping source:', error);
      throw error;
    }
  }

  /**
   * Update scraping source configuration
   */
  async updateScrapingSource(sourceId: string, updates: Partial<ScrapingSource>): Promise<boolean> {
    try {
      const updateData: any = {};

      if (updates.name) updateData.name = updates.name;
      if (updates.baseUrl) updateData.baseUrl = updates.baseUrl;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      if (updates.rateLimit) updateData.rateLimit = updates.rateLimit;
      if (updates.config) updateData.config = JSON.stringify(updates.config);

      const result = await prisma.jobSource.updateMany({
        where: { id: sourceId },
        data: updateData,
      });

      if (result.count > 0) {
        logger.info(`Updated scraping source ${sourceId}`);

        // Restart scraper if source is active
        if (updates.isActive) {
          const source = await prisma.jobSource.findUnique({
            where: { id: sourceId },
          });

          if (source && !this.activeScrapers.has(sourceId)) {
            await this.startSourceScraping(source);
          }
        } else {
          // Stop scraper if source is disabled
          const interval = this.activeScrapers.get(sourceId);
          if (interval) {
            clearInterval(interval);
            this.activeScrapers.delete(sourceId);
            logger.info(`Stopped scraper for source ${sourceId}`);
          }
        }
      }

      return result.count > 0;
    } catch (error) {
      logger.error(`Error updating scraping source ${sourceId}:`, error);
      return false;
    }
  }

  /**
   * Get scraping statistics
   */
  async getScrapingStats(): Promise<any> {
    try {
      const sources = await prisma.jobSource.findMany({
        include: {
          _count: {
            select: {
              scrapingJobs: true,
              scrapingSessions: true,
            },
          },
        },
      });

      const totalJobs = await prisma.jobSource.aggregate({
        _sum: {
          totalJobs: true,
        },
      });

      return {
        totalSources: sources.length,
        activeSources: sources.filter(s => s.isActive).length,
        totalJobsScraped: totalJobs._sum.totalJobs || 0,
        sources: sources.map(source => ({
          id: source.id,
          name: source.name,
          isActive: source.isActive,
          rateLimit: source.rateLimit,
          totalJobs: source.totalJobs,
          lastScraped: source.lastScraped,
          jobCount: source._count.scrapingJobs,
          sessionCount: source._count.scrapingSessions,
        })),
      };
    } catch (error) {
      logger.error('Error getting scraping stats:', error);
      throw error;
    }
  }

  /**
   * Force scrape a specific source
   */
  async forceScrapeSource(sourceId: string): Promise<boolean> {
    try {
      const source = await prisma.jobSource.findUnique({
        where: { id: sourceId },
      });

      if (!source || !source.isActive) {
        logger.warn(`Source ${sourceId} not found or inactive`);
        return false;
      }

      // Scrape immediately
      await this.scrapeSource(source);
      return true;
    } catch (error) {
      logger.error(`Error force scraping source ${sourceId}:`, error);
      return false;
    }
  }

  /**
   * Get active scraping sessions
   */
  async getActiveSessions(): Promise<any[]> {
    try {
      return await prisma.scrapingSession.findMany({
        where: {
          status: {
            in: ['PENDING', 'RUNNING'],
          },
        },
        include: {
          source: true,
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
      });
    } catch (error) {
      logger.error('Error getting active sessions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const enhancedScraperManager = new EnhancedJobScraperManager();
