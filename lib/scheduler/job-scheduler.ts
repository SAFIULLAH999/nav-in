import { JobQueueManager } from '@/lib/queue/job-queue-manager'

export interface ScheduledJob {
  id: string
  name: string
  type: string
  cronExpression: string
  config: any
  isActive: boolean
  lastRun?: Date
  nextRun: Date
  createdAt: Date
  updatedAt: Date
}

export class JobScheduler {
  private queueManager: JobQueueManager
  private scheduledJobs: Map<string, ScheduledJob> = new Map()
  private isRunning = false
  private schedulerInterval: NodeJS.Timeout | null = null

  constructor() {
    this.queueManager = new JobQueueManager()
  }

  // Start the scheduler
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Job scheduler is already running')
      return
    }

    this.isRunning = true
    console.log('Starting job scheduler...')

    // Load existing scheduled jobs
    await this.loadScheduledJobs()

    // Check for jobs to run every minute
    this.schedulerInterval = setInterval(async () => {
      await this.checkScheduledJobs()
    }, 60000)

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.stop())
    process.on('SIGINT', () => this.stop())
  }

  // Stop the scheduler
  async stop(): Promise<void> {
    if (!this.isRunning) return

    this.isRunning = false
    console.log('Stopping job scheduler...')

    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval)
      this.schedulerInterval = null
    }
  }

  // Schedule a new job
  async scheduleJob(
    name: string,
    type: string,
    cronExpression: string,
    config: any,
    priority: number = 5
  ): Promise<string> {
    try {
      const nextRun = this.calculateNextRun(cronExpression)

      // In a real implementation, you'd store this in a database
      // For now, we'll store it in memory
      const scheduledJob: ScheduledJob = {
        id: `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        type,
        cronExpression,
        config: {
          ...config,
          priority,
          schedule: cronExpression
        },
        isActive: true,
        nextRun,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      this.scheduledJobs.set(scheduledJob.id, scheduledJob)

      console.log(`Scheduled job '${name}' with cron '${cronExpression}' - next run: ${nextRun}`)

      return scheduledJob.id
    } catch (error) {
      console.error('Error scheduling job:', error)
      throw error
    }
  }

  // Unschedule a job
  async unscheduleJob(jobId: string): Promise<boolean> {
    const removed = this.scheduledJobs.delete(jobId)
    if (removed) {
      console.log(`Unscheduled job ${jobId}`)
    }
    return removed
  }

  // Get all scheduled jobs
  async getScheduledJobs(): Promise<ScheduledJob[]> {
    return Array.from(this.scheduledJobs.values())
  }

  // Get a specific scheduled job
  async getScheduledJob(jobId: string): Promise<ScheduledJob | null> {
    return this.scheduledJobs.get(jobId) || null
  }

  // Update a scheduled job
  async updateScheduledJob(jobId: string, updates: Partial<ScheduledJob>): Promise<boolean> {
    const job = this.scheduledJobs.get(jobId)
    if (!job) return false

    const updatedJob = {
      ...job,
      ...updates,
      updatedAt: new Date()
    }

    // Recalculate next run if cron expression changed
    if (updates.cronExpression && updates.cronExpression !== job.cronExpression) {
      updatedJob.nextRun = this.calculateNextRun(updates.cronExpression)
    }

    this.scheduledJobs.set(jobId, updatedJob)
    return true
  }

  // Main scheduler logic - check if any jobs need to run
  private async checkScheduledJobs(): Promise<void> {
    const now = new Date()

    for (const [jobId, job] of Array.from(this.scheduledJobs.entries())) {
      if (!job.isActive) continue

      if (now >= job.nextRun) {
        try {
          console.log(`Running scheduled job: ${job.name} (${jobId})`)

          // Add job to queue
          await this.queueManager.addJob({
            type: job.type,
            data: JSON.stringify(job.config),
            priority: job.config.priority || 5,
            scheduledFor: now
          })

          // Update last run and calculate next run
          job.lastRun = now
          job.nextRun = this.calculateNextRun(job.cronExpression)
          job.updatedAt = new Date()

          console.log(`Scheduled job ${job.name} completed - next run: ${job.nextRun}`)

        } catch (error) {
          console.error(`Error running scheduled job ${job.name}:`, error)
        }
      }
    }
  }

  // Load scheduled jobs from storage (placeholder for database storage)
  private async loadScheduledJobs(): Promise<void> {
    // In a real implementation, load from database
    // For now, we'll create some default scheduled jobs

    try {
      // Daily job scraping at 2 AM
      await this.scheduleJob(
        'Daily Job Scraping',
        'scheduled_scraping',
        '0 2 * * *', // Every day at 2 AM
        {
          searchQuery: 'software engineer',
          location: 'United States',
          limit: 100,
          sources: ['indeed', 'linkedin'],
          priority: 'normal'
        },
        5
      )

      // Weekly comprehensive scraping on Sundays at 3 AM
      await this.scheduleJob(
        'Weekly Comprehensive Scraping',
        'scheduled_scraping',
        '0 3 * * 0', // Every Sunday at 3 AM
        {
          searchQuery: 'tech jobs',
          location: 'United States',
          limit: 500,
          sources: ['indeed', 'linkedin'],
          priority: 'high'
        },
        10
      )

      console.log('Loaded default scheduled jobs')

    } catch (error) {
      console.error('Error loading scheduled jobs:', error)
    }
  }

  // Calculate next run time from cron expression
  private calculateNextRun(cronExpression: string): Date {
    const [minutes, hours, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ')

    const nextRun = new Date()

    // Handle different cron patterns
    if (minutes !== '*') {
      nextRun.setMinutes(parseInt(minutes))
    } else {
      nextRun.setMinutes(nextRun.getMinutes() + 1) // Next minute if wildcard
    }

    if (hours !== '*') {
      nextRun.setHours(parseInt(hours))
    }

    // Handle day of month
    if (dayOfMonth !== '*') {
      nextRun.setDate(parseInt(dayOfMonth))
    }

    // Handle month
    if (month !== '*') {
      nextRun.setMonth(parseInt(month) - 1) // Month is 0-indexed
    }

    // Handle day of week
    if (dayOfWeek !== '*') {
      const targetDay = parseInt(dayOfWeek)
      const currentDay = nextRun.getDay()
      const daysUntilTarget = (targetDay - currentDay + 7) % 7
      if (daysUntilTarget === 0) {
        nextRun.setDate(nextRun.getDate() + 7) // Next week same day
      } else {
        nextRun.setDate(nextRun.getDate() + daysUntilTarget)
      }
    }

    // If the calculated time is in the past, add appropriate interval
    if (nextRun <= new Date()) {
      if (dayOfWeek !== '*') {
        nextRun.setDate(nextRun.getDate() + 7) // Next week
      } else if (hours !== '*') {
        nextRun.setDate(nextRun.getDate() + 1) // Next day
      } else {
        nextRun.setDate(nextRun.getDate() + 1) // Fallback to next day
      }
    }

    return nextRun
  }

  // Get scheduler statistics
  async getStats(): Promise<{
    isRunning: boolean
    totalScheduledJobs: number
    activeJobs: number
    nextRuns: Array<{ name: string; nextRun: Date }>
  }> {
    const jobs = Array.from(this.scheduledJobs.values())
    const activeJobs = jobs.filter(job => job.isActive)

    const nextRuns = activeJobs
      .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime())
      .slice(0, 5)
      .map(job => ({
        name: job.name,
        nextRun: job.nextRun
      }))

    return {
      isRunning: this.isRunning,
      totalScheduledJobs: jobs.length,
      activeJobs: activeJobs.length,
      nextRuns
    }
  }
}