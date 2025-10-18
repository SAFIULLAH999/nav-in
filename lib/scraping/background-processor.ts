import { enhancedJobScraper } from '@/lib/job-scrapers/enhanced-job-scraper';

export class BackgroundScrapingProcessor {
  private isRunning = false;
  private intervalId?: NodeJS.Timeout;

  start(intervalMinutes = 15) {
    if (this.isRunning) {
      console.log('Background processor already running');
      return;
    }

    this.isRunning = true;
    console.log(`Starting background scraping processor (interval: ${intervalMinutes} minutes)`);

    // Process immediately
    this.processQueue();

    // Then process every interval
    this.intervalId = setInterval(() => {
      this.processQueue();
    }, intervalMinutes * 60 * 1000);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isRunning = false;
    console.log('Background scraping processor stopped');
  }

  private async processQueue() {
    try {
      console.log('Processing scraping queue...');
      await enhancedJobScraper.processScrapingQueue();
      console.log('Queue processing completed');
    } catch (error) {
      console.error('Error in background queue processing:', error);
    }
  }

  async triggerFullScraping() {
    try {
      console.log('Triggering full scraping from all sources...');
      const results = await enhancedJobScraper.scrapeFromMultipleSources();

      console.log('Full scraping completed:', results);

      return {
        success: true,
        results,
      };
    } catch (error) {
      console.error('Error in full scraping:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export const backgroundProcessor = new BackgroundScrapingProcessor();