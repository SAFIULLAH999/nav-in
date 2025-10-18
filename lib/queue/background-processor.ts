import { JobQueueManager } from './job-queue-manager'
import { EnhancedJobScraperManager } from '@/lib/job-scrapers/enhanced-scraper-manager'

export class BackgroundJobProcessor {
  private queueManager: JobQueueManager
  private scraperManager: EnhancedJobScraperManager
  private isRunning = false
  private processingInterval: NodeJS.Timeout | null = null

  constructor() {
    this.queueManager = new JobQueueManager()
    this.scraperManager = new EnhancedJobScraperManager()
  }

  // Start the background processor
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Background processor is already running')
      return
    }

    this.isRunning = true
    console.log('Starting background job processor...')

    // Process jobs immediately
    await this.processJobs()

    // Set up interval to process jobs every 30 seconds
    this.processingInterval = setInterval(async () => {
      await this.processJobs()
    }, 30000)

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.stop())
    process.on('SIGINT', () => this.stop())
  }

  // Stop the background processor
  async stop(): Promise<void> {
    if (!this.isRunning) return

    this.isRunning = false
    console.log('Stopping background job processor...')

    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }
  }

  // Main job processing loop
  private async processJobs(): Promise<void> {
    try {
      const job = await this.queueManager.getNextJob()

      if (!job) {
        // No jobs in queue, wait for next interval
        return
      }

      console.log(`Processing job ${job.id} of type ${job.type}`)

      switch (job.type) {
        case 'scheduled_scraping':
          await this.processScrapingJob(job)
          break

        case 'immediate_scraping':
          await this.processScrapingJob(job)
          break

        default:
          console.warn(`Unknown job type: ${job.type}`)
          await this.queueManager.updateJobStatus(job.id, 'failed', {
            error: `Unknown job type: ${job.type}`
          })
      }

    } catch (error) {
      console.error('Error in job processing loop:', error)
    }
  }

  // Process scraping jobs
  private async processScrapingJob(job: any): Promise<void> {
    try {
      const config = JSON.parse(job.data)

      console.log(`Starting scraping job: ${config.searchQuery} in ${config.location}`)

      const result = await this.scraperManager.scrapeJobsWithConfig(config)

      if (result.success) {
        await this.queueManager.updateJobStatus(job.id, 'completed', {
          jobsScraped: result.jobsScraped,
          duration: result.duration,
          errors: result.errors
        })

        console.log(`Completed scraping job ${job.id}: ${result.jobsScraped} jobs scraped`)
      } else {
        await this.queueManager.updateJobStatus(job.id, 'failed', {
          error: `Scraping failed: ${result.errors.join(', ')}`
        })

        console.error(`Failed scraping job ${job.id}:`, result.errors)
      }

    } catch (error) {
      console.error(`Error processing scraping job ${job.id}:`, error)
      await this.queueManager.updateJobStatus(job.id, 'failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  // Get processor statistics
  async getStats(): Promise<{
    isRunning: boolean
    queueStats: any
    recentJobs: any[]
  }> {
    const queueStats = await this.queueManager.getQueueStats()

    const recentJobs = await this.queueManager.getJobsByType('scheduled_scraping', 5)

    return {
      isRunning: this.isRunning,
      queueStats,
      recentJobs: recentJobs.map(job => ({
        id: job.id,
        status: job.status,
        createdAt: job.createdAt,
        attempts: job.attempts
      }))
    }
  }

  // Health check method
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy'
    isRunning: boolean
    lastError?: string
    uptime: number
  }> {
    const startTime = Date.now() - (process.uptime() * 1000)

    try {
      // Test database connection
      await this.queueManager.getQueueStats()

      return {
        status: 'healthy',
        isRunning: this.isRunning,
        uptime: Date.now() - startTime
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        isRunning: this.isRunning,
        lastError: error instanceof Error ? error.message : 'Unknown error',
        uptime: Date.now() - startTime
      }
    }
  }
}