import { IndeedScraper } from './indeed-scraper'
import { prisma } from '@/lib/prisma'
import { jobUrlValidator } from './job-validator'

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
  private indeedScraper = new IndeedScraper()

  async scrapeAllJobs(searchQuery: string, location: string, limit: number = 100): Promise<ScrapedJob[]> {
    const allJobs: ScrapedJob[] = []

    try {
      console.log(`Starting job scraping for: ${searchQuery} in ${location}`)
      const jobsPerSource = Math.floor(limit / 2)
      const indeedJobs = await this.indeedScraper.scrapeJobs(searchQuery, location, jobsPerSource)
      allJobs.push(...indeedJobs)
      await this.storeJobs(allJobs)
      console.log(`Total jobs scraped: ${allJobs.length}`)
      return allJobs
    } catch (error) {
      console.error('Error in job scraping:', error)
      return []
    }
  }

  private async storeJobs(jobs: ScrapedJob[]): Promise<void> {
    try {
      for (const job of jobs) {
        const existingJob = await prisma.job.findFirst({
          where: {
            sourceId: job.externalId,
          },
        })

        const validation = await jobUrlValidator.validateJobUrl(job.applyUrl)

        if (!validation.isValid) {
          console.log(`Skipping invalid job URL: ${job.applyUrl}`)
          continue
        }

        const applyUrl = validation.finalUrl || job.applyUrl

        if (!existingJob) {
          await prisma.job.create({
            data: {
              title: job.title,
              description: job.description,
              companyName: job.company,
              location: job.location,
              type: job.jobType,
              salaryMin: job.salary ? this.parseSalary(job.salary).min : null,
              salaryMax: job.salary ? this.parseSalary(job.salary).max : null,
              requirements: job.description.substring(0, 500),
              skills: this.extractSkills(job.description),
              experience: this.extractExperience(job.title),
              authorId: 'system',
              isActive: true,
              isRemote: job.location.toLowerCase().includes('remote'),
              applicationDeadline: this.calculateDeadline(job.postedDate),
              sourceUrl: applyUrl,
              sourceId: job.externalId,
              source: 'INDEED',
              isScraped: true,
              lastScraped: new Date(),
              validityStatus: 'VALID',
              lastValidated: new Date(),
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
    const match = salary.match(/\$?(\d+)[Kk]?[,\s]*[-–to]*[,\s]*\$?(\d+)?[Kk]?/)
    if (match) {
      const min = parseInt(match[1]) * 1000
      const max = match[2] ? parseInt(match[2]) * 1000 : min
      return { min, max }
    }
    return { min: null, max: null }
  }

  private extractSkills(description: string): string {
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

      const lastJob = await prisma.job.findFirst({
        where: { authorId: 'system' },
        orderBy: { createdAt: 'desc' }
      })

      return {
        totalJobs,
        jobsBySource: {},
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