import { IndeedScraper } from './indeed-scraper'
import { LinkedInScraper } from './linkedin-scraper'
import { prisma } from '@/lib/prisma'
import { JobQueueManager } from '@/lib/queue/job-queue-manager'

export interface ScrapedJob {
  title: string
  company: string
  location: string
  description: string
  salary?: string
  jobType: string
  postedDate: string
  applyUrl: string
  source: string
  externalId: string
  requirements?: string[]
  benefits?: string[]
  skills?: string[]
}

export interface ScrapingConfig {
  searchQuery: string
  location: string
  limit: number
  sources: string[]
  priority: 'low' | 'normal' | 'high'
  schedule?: string // cron expression
}

export interface ScrapingResult {
  success: boolean
  jobsScraped: number
  errors: string[]
  duration: number
  source: string
}

export class EnhancedJobScraperManager {
  private scrapers = {
    indeed: new IndeedScraper(),
    linkedin: new LinkedInScraper()
  }

  private queueManager: JobQueueManager
  private isProcessing = false

  constructor() {
    this.queueManager = new JobQueueManager()
  }

  // Main scraping method with enhanced features
  async scrapeJobsWithConfig(config: ScrapingConfig): Promise<ScrapingResult> {
    const startTime = Date.now()
    const errors: string[] = []
    let totalJobsScraped = 0

    try {
      console.log(`Starting enhanced job scraping: ${config.searchQuery} in ${config.location}`)

      for (const source of config.sources) {
        try {
          if (!this.scrapers[source as keyof typeof this.scrapers]) {
            errors.push(`Unsupported source: ${source}`)
            continue
          }

          const scraper = this.scrapers[source as keyof typeof this.scrapers]
          const jobsPerSource = Math.ceil(config.limit / config.sources.length)

          console.log(`Scraping ${jobsPerSource} jobs from ${source}`)

          const jobs = await scraper.scrapeJobs(
            config.searchQuery,
            config.location,
            jobsPerSource
          )

          if (jobs.length > 0) {
            await this.storeJobsWithEnhancements(jobs, source)
            totalJobsScraped += jobs.length

            // Log scraping activity
            await this.logScrapingActivity(source, jobs.length, 'success')
          } else {
            await this.logScrapingActivity(source, 0, 'no_jobs_found')
          }

        } catch (error) {
          const errorMsg = `Error scraping ${source}: ${error instanceof Error ? error.message : 'Unknown error'}`
          errors.push(errorMsg)
          await this.logScrapingActivity(source, 0, 'error', errorMsg)
          console.error(errorMsg)
        }
      }

      const duration = Date.now() - startTime

      // Schedule next scraping if configured
      if (config.schedule) {
        await this.scheduleNextScraping(config)
      }

      return {
        success: errors.length === 0,
        jobsScraped: totalJobsScraped,
        errors,
        duration,
        source: config.sources.join(',')
      }

    } catch (error) {
      const duration = Date.now() - startTime
      const errorMsg = `Critical error in scraping: ${error instanceof Error ? error.message : 'Unknown error'}`

      return {
        success: false,
        jobsScraped: totalJobsScraped,
        errors: [...errors, errorMsg],
        duration,
        source: config.sources.join(',')
      }
    }
  }

  // Enhanced job storage with better data processing
  private async storeJobsWithEnhancements(jobs: ScrapedJob[], source: string): Promise<void> {
    for (const job of jobs) {
      try {
        // Check if job already exists (enhanced duplicate detection)
        const existingJob = await prisma.job.findFirst({
          where: {
            title: { contains: job.title.substring(0, 50) },
            companyName: { contains: job.company.substring(0, 50) }
          }
        })

        if (!existingJob) {
          // Enhanced data processing
          const enhancedJobData = {
            title: job.title,
            description: job.description,
            companyName: job.company,
            location: job.location,
            type: this.normalizeJobType(job.jobType),
            salaryMin: job.salary ? this.parseSalary(job.salary).min : null,
            salaryMax: job.salary ? this.parseSalary(job.salary).max : null,
            requirements: JSON.stringify(job.requirements || this.extractRequirements(job.description)),
            skills: JSON.stringify(job.skills || this.extractSkills(job.description)),
            experience: this.extractExperience(job.title, job.description),
            authorId: 'system',
            isActive: true,
            isRemote: this.detectRemote(job.location, job.description),
            applicationDeadline: this.calculateDeadline(job.postedDate),
            benefits: job.benefits ? JSON.stringify(job.benefits) : null
          }

          await prisma.job.create({ data: enhancedJobData })
          console.log(`Stored enhanced job: ${job.title} at ${job.company}`)
        }
      } catch (error) {
        console.error(`Error storing job ${job.title}:`, error)
      }
    }
  }

  // Enhanced helper methods
  private normalizeJobType(jobType: string): string {
    const normalized = jobType.toLowerCase()
    if (normalized.includes('full') || normalized.includes('permanent')) return 'FULL_TIME'
    if (normalized.includes('part')) return 'PART_TIME'
    if (normalized.includes('contract')) return 'CONTRACT'
    if (normalized.includes('intern')) return 'INTERNSHIP'
    if (normalized.includes('freelance')) return 'FREELANCE'
    if (normalized.includes('temp')) return 'TEMPORARY'
    return 'FULL_TIME'
  }

  private parseSalary(salary: string): { min: number | null, max: number | null } {
    // Enhanced salary parsing with multiple formats
    const cleanSalary = salary.replace(/[$,]/g, '').toLowerCase()

    // Handle ranges like "$50,000 - $70,000"
    const rangeMatch = cleanSalary.match(/(\d+)\s*[-–to]+\s*(\d+)/)
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1]) * 1000
      const max = parseInt(rangeMatch[2]) * 1000
      return { min, max }
    }

    // Handle single amounts like "$60,000"
    const singleMatch = cleanSalary.match(/(\d+)/)
    if (singleMatch) {
      const amount = parseInt(singleMatch[1]) * 1000
      return { min: amount, max: amount }
    }

    return { min: null, max: null }
  }

  private extractRequirements(description: string): string[] {
    // Enhanced requirement extraction
    const requirements: string[] = []
    const sentences = description.split(/[.!?]+/)

    for (const sentence of sentences) {
      const lower = sentence.toLowerCase()
      if (
        lower.includes('require') ||
        lower.includes('must have') ||
        lower.includes('experience with') ||
        lower.includes('knowledge of') ||
        lower.includes('proficiency in')
      ) {
        requirements.push(sentence.trim())
      }
    }

    return requirements.slice(0, 10) // Limit to 10 requirements
  }

  private extractSkills(description: string): string[] {
    // Enhanced skill extraction with common tech skills
    const commonSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'PHP', 'Ruby', 'Go', 'Rust',
      'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Laravel',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'Git', 'MongoDB', 'PostgreSQL',
      'MySQL', 'Redis', 'Elasticsearch', 'GraphQL', 'REST', 'API', 'Microservices', 'Agile',
      'Scrum', 'DevOps', 'CI/CD', 'Linux', 'Windows', 'macOS', 'Android', 'iOS', 'React Native',
      'Flutter', 'Xamarin', 'Unity', 'Unreal Engine', 'Machine Learning', 'AI', 'Data Science',
      'TensorFlow', 'PyTorch', 'Pandas', 'NumPy', 'Jupyter', 'Tableau', 'Power BI', 'Excel',
      'PowerPoint', 'Word', 'Project Management', 'Leadership', 'Communication', 'Teamwork'
    ]

    const foundSkills = commonSkills.filter(skill =>
      description.toLowerCase().includes(skill.toLowerCase())
    )

    return Array.from(new Set(foundSkills)).slice(0, 20) // Remove duplicates and limit
  }

  private extractExperience(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase()

    if (text.includes('senior') || text.includes('lead') || text.includes('principal') || text.includes('head')) {
      return 'SENIOR'
    } else if (text.includes('junior') || text.includes('entry') || text.includes('graduate') || text.includes('intern')) {
      return 'JUNIOR'
    } else if (text.includes('mid') || text.includes('intermediate') || text.includes('3+') || text.includes('5+')) {
      return 'MID'
    }

    return 'MID' // Default to mid-level
  }

  private detectRemote(location: string, description: string): boolean {
    const text = `${location} ${description}`.toLowerCase()
    return text.includes('remote') || text.includes('work from home') || text.includes('wfh') || text.includes('telecommute')
  }

  private calculateDeadline(postedDate: string): Date {
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 30) // 30 days default
    return deadline
  }

  private async logScrapingActivity(source: string, jobsFound: number, status: string, error?: string): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          eventType: 'scraping',
          eventName: `scraping_${source}_${status}`,
          properties: JSON.stringify({
            source,
            jobsFound,
            status,
            error,
            timestamp: new Date().toISOString()
          })
        }
      })
    } catch (error) {
      console.error('Error logging scraping activity:', error)
    }
  }

  private async scheduleNextScraping(config: ScrapingConfig): Promise<void> {
    if (!config.schedule) return

    try {
      await this.queueManager.addJob({
        type: 'scheduled_scraping',
        data: JSON.stringify(config),
        scheduledFor: this.calculateNextRun(config.schedule),
        priority: config.priority === 'high' ? 10 : config.priority === 'normal' ? 5 : 1
      })
    } catch (error) {
      console.error('Error scheduling next scraping:', error)
    }
  }

  private calculateNextRun(cronExpression: string): Date {
    // Simple cron parser - in production, use a proper cron library
    const [minutes, hours, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ')

    const nextRun = new Date()
    if (minutes !== '*') nextRun.setMinutes(parseInt(minutes))
    if (hours !== '*') nextRun.setHours(parseInt(hours))

    // Add one day for daily runs
    if (dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      nextRun.setDate(nextRun.getDate() + 1)
    }

    return nextRun
  }

  // Background processing method
  async processScrapingQueue(): Promise<void> {
    if (this.isProcessing) return

    this.isProcessing = true

    try {
      while (true) {
        const job = await this.queueManager.getNextJob()
        if (!job) break

        try {
          const config: ScrapingConfig = JSON.parse(job.data)
          console.log(`Processing scraping job: ${job.id}`)

          const result = await this.scrapeJobsWithConfig(config)

          // Update job status
          await this.queueManager.updateJobStatus(job.id, 'completed', {
            jobsScraped: result.jobsScraped,
            errors: result.errors,
            duration: result.duration
          })

        } catch (error) {
          console.error(`Error processing scraping job ${job.id}:`, error)
          await this.queueManager.updateJobStatus(job.id, 'failed', {
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }

        // Small delay between jobs
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } finally {
      this.isProcessing = false
    }
  }

  // Get scraping statistics
  async getScrapingStats(): Promise<{
    totalJobs: number
    jobsBySource: Record<string, number>
    lastScraped: Date | null
    recentActivity: any[]
  }> {
    try {
      const totalJobs = await prisma.job.count({
        where: { authorId: 'system' }
      })

      // Since source field doesn't exist, we'll use a different approach
      // For now, return empty source stats - this can be enhanced later
      const sourceStats: Record<string, number> = {}

      const lastJob = await prisma.job.findFirst({
        where: { authorId: 'system' },
        orderBy: { createdAt: 'desc' }
      })

      // Get recent scraping activity
      const recentActivity = await prisma.analyticsEvent.findMany({
        where: {
          eventType: 'scraping',
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        orderBy: { timestamp: 'desc' },
        take: 10
      })

      return {
        totalJobs,
        jobsBySource: sourceStats,
        lastScraped: lastJob?.createdAt || null,
        recentActivity: recentActivity.map(event => ({
          event: event.eventName,
          timestamp: event.timestamp,
          properties: JSON.parse(event.properties || '{}')
        }))
      }
    } catch (error) {
      console.error('Error getting scraping stats:', error)
      return {
        totalJobs: 0,
        jobsBySource: {},
        lastScraped: null,
        recentActivity: []
      }
    }
  }
}