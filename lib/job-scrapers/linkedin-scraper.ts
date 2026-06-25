import axios from 'axios'
import * as cheerio from 'cheerio'

export interface ScrapedJob {
  title: string
  company: string
  location: string
  description: string
  salary?: string
  jobType: string
  postedDate: string
  applyUrl: string
  source: 'linkedin'
  externalId: string
}

export class LinkedInScraper {
  private baseUrl = 'https://www.linkedin.com'

  async scrapeJobs(searchQuery: string, location: string, limit: number = 50): Promise<ScrapedJob[]> {
    // LinkedIn has strong anti-scraping; return empty to avoid fake/mock jobs
    console.log('LinkedIn scraping skipped (anti-scraping protection)')
    return []
  }

  async scrapeJobDetails(jobUrl: string): Promise<Partial<ScrapedJob> | null> {
    console.log('LinkedIn job details scraping skipped')
    return null
  }
}