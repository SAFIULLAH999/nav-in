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
  source: 'indeed'
  externalId: string
}

export class IndeedScraper {
  private baseUrl = 'https://www.indeed.com'

  async scrapeJobs(searchQuery: string, location: string, limit: number = 50): Promise<ScrapedJob[]> {
    try {
      const jobs: ScrapedJob[] = []
      const searchUrl = `${this.baseUrl}/jobs?q=${encodeURIComponent(searchQuery)}&l=${encodeURIComponent(location)}`

      console.log(`Scraping Indeed for: ${searchQuery} in ${location}`)

      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Cache-Control': 'max-age=0'
        },
        timeout: 20000,
        maxRedirects: 5
      })

      const $ = cheerio.load(response.data)
      const jobCards = $('.jobsearch-SerpJobCard').slice(0, limit)

      console.log(`Found ${jobCards.length} job cards on Indeed`)

      jobCards.each((index, card) => {
        try {
          const title = $(card).find('.title a').text().trim() || $(card).find('.jobTitle').text().trim()
          const company = $(card).find('.company').text().trim() || $(card).find('[data-testid="company-name"]').text().trim()
          const locationText = $(card).find('.location').text().trim() || $(card).find('[data-testid="text-location"]').text().trim()
          const description = $(card).find('.summary').text().trim() || $(card).find('[data-testid="job-snippet"]').text().trim()
          const salary = $(card).find('.salary-snippet').text().trim() || $(card).find('[data-testid="attribute_snippet_testid"]').text().trim()
          const jobType = $(card).find('.jobType').text().trim() || $(card).find('[data-testid="job-type"]').text().trim() || 'Full-time'
          const postedDate = $(card).find('.date').text().trim() || $(card).find('[data-testid="days-since-posted"]').text().trim()
          const externalId = $(card).attr('data-jk') || Math.random().toString(36).substr(2, 9)
          const applyUrl = this.buildJobUrl(externalId)

          console.log(`Job ${index + 1}: ${title} at ${company}`)

          if (title && company) {
            jobs.push({
              title,
              company,
              location: locationText,
              description,
              salary,
              jobType,
              postedDate,
              applyUrl,
              source: 'indeed',
              externalId
            })
          }
        } catch (error) {
          console.error('Error parsing Indeed job card:', error)
        }
      })

      console.log(`Successfully scraped ${jobs.length} jobs from Indeed`)
      return jobs

    } catch (error: any) {
      console.error('Error scraping Indeed:', error.message || error)
      return []
    }
  }

  private buildJobUrl(jobKey: string): string {
    if (!jobKey) return this.baseUrl
    return `${this.baseUrl}/viewjob?jk=${encodeURIComponent(jobKey)}`
  }

  async scrapeJobDetails(jobUrl: string): Promise<Partial<ScrapedJob> | null> {
    try {
      const response = await axios.get(jobUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 20000,
        maxRedirects: 5
      })

      const $ = cheerio.load(response.data)

      const fullDescription = $('#jobDescriptionText').text().trim() || $('[data-testid="job-description"]').text().trim()
      const requirements = $('.jobsearch-JobRequirements-item').map((i: number, el) =>
        $(el).text().trim()
      ).get().join('\n')

      const result: any = {}
      if (fullDescription) result.description = fullDescription
      if (requirements) result.requirements = requirements

      return result

    } catch (error: any) {
      console.error('Error scraping Indeed job details:', error.message || error)
      return null
    }
  }
}