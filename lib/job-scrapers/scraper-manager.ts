import { IndeedScraper } from './indeed-scraper'
import { LinkedInScraper } from './linkedin-scraper'
import { prisma } from '@/lib/prisma'

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
}

export class JobScraperManager {
  private scrapers = {
    indeed: new IndeedScraper(),
    linkedin: new LinkedInScraper()
  }

  async scrapeAllJobs(searchQuery: string, location: string, limit: number = 100): Promise<ScrapedJob[]> {
    const allJobs: ScrapedJob[] = []

    try {
      console.log(`Starting job scraping for: ${searchQuery} in ${location}`)

      // Scrape from Indeed
      const indeedJobs = await this.scrapers.indeed.scrapeJobs(searchQuery, location, Math.floor(limit / 2))
      allJobs.push(...indeedJobs)

      // Scrape from LinkedIn (mock for demo)
      const linkedinJobs = await this.scrapers.linkedin.scrapeJobs(searchQuery, location, Math.floor(limit / 2))
      allJobs.push(...linkedinJobs)

      console.log(`Total jobs scraped: ${allJobs.length}`)

      // Store jobs in database
      await this.storeJobs(allJobs)

      return allJobs

    } catch (error) {
      console.error('Error in job scraping:', error)
      return []
    }
  }

  private async storeJobs(jobs: ScrapedJob[]): Promise<void> {
    try {
      for (const job of jobs) {
        // Check if job already exists
        const existingJob = await prisma.job.findFirst({
          where: {
            title: { contains: job.title.substring(0, 50) },
            companyName: { contains: job.company.substring(0, 50) }
          }
        })

        if (!existingJob) {
          // Create new job
          await prisma.job.create({
            data: {
              title: job.title,
              description: job.description,
              companyName: job.company,
              location: job.location,
              type: job.jobType,
              salaryMin: job.salary ? this.parseSalary(job.salary).min : null,
              salaryMax: job.salary ? this.parseSalary(job.salary).max : null,
              requirements: job.description.substring(0, 500), // First 500 chars as requirements
              skills: this.extractSkills(job.description),
              experience: this.extractExperience(job.title),
              authorId: 'system', // System-created jobs
              isActive: true,
              isRemote: job.location.toLowerCase().includes('remote'),
              applicationDeadline: this.calculateDeadline(job.postedDate)
            }
          })

          console.log(`Stored job: ${job.title} at ${job.company}`)
        }
      }
    } catch (error) {
      console.error('Error storing jobs:', error)
    }
  }

  private parseSalary(salary: string): { min: number | null, max: number | null } {
    // Simple salary parsing - in production, use a more sophisticated parser
    const match = salary.match(/\$?(\d+)[Kk]?[,\s]*[-–to]*[,\s]*\$?(\d+)?[Kk]?/)
    if (match) {
      const min = parseInt(match[1]) * 1000
      const max = match[2] ? parseInt(match[2]) * 1000 : min
      return { min, max }
    }
    return { min: null, max: null }
  }

  private extractSkills(description: string): string {
    // Simple skill extraction - in production, use NLP or predefined skill lists
    const commonSkills = ['JavaScript', 'Python', 'React', 'Node.js', 'TypeScript', 'AWS', 'Docker', 'Kubernetes']
    const foundSkills = commonSkills.filter(skill =>
      description.toLowerCase().includes(skill.toLowerCase())
    )
    return JSON.stringify(foundSkills)
  }

  private extractExperience(title: string): string {
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('senior') || lowerTitle.includes('lead') || lowerTitle.includes('principal')) {
      return 'SENIOR'
    } else if (lowerTitle.includes('junior') || lowerTitle.includes('entry')) {
      return 'JUNIOR'
    }
    return 'MID'
  }

  private calculateDeadline(postedDate: string): Date {
    // Set application deadline to 30 days from posting
    const deadline = new Date()
    deadline.setDate(deadline.getDate() + 30)
    return deadline
  }

  async getScrapingStats(): Promise<{
    totalJobs: number
    jobsBySource: Record<string, number>
    lastScraped: Date | null
  }> {
    try {
      const totalJobs = await prisma.job.count({
        where: { authorId: 'system' }
      })

      // Since source field doesn't exist in schema, we'll use empty stats for now
      const sourceStats: Record<string, number> = {}

      const lastJob = await prisma.job.findFirst({
        where: { authorId: 'system' },
        orderBy: { createdAt: 'desc' }
      })

      return {
        totalJobs,
        jobsBySource: sourceStats,
        lastScraped: lastJob?.createdAt || null
      }
    } catch (error) {
      console.error('Error getting scraping stats:', error)
      return {
        totalJobs: 0,
        jobsBySource: {},
        lastScraped: null
      }
    }
  }
}