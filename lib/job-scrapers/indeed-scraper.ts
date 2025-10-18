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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      const $ = cheerio.load(response.data)
      const jobCards = $('.jobsearch-SerpJobCard').slice(0, limit)

      for (const card of jobCards) {
        try {
          const title = $(card).find('.title a').text().trim()
          const company = $(card).find('.company').text().trim()
          const location = $(card).find('.location').text().trim()
          const description = $(card).find('.summary').text().trim()
          const salary = $(card).find('.salary-snippet').text().trim()
          const jobType = $(card).find('.jobType').text().trim() || 'Full-time'
          const postedDate = $(card).find('.date').text().trim()
          const relativeUrl = $(card).find('.title a').attr('href')
          const applyUrl = relativeUrl ? `${this.baseUrl}${relativeUrl}` : searchUrl
          const externalId = $(card).attr('data-jk') || Math.random().toString(36).substr(2, 9)

          if (title && company) {
            jobs.push({
              title,
              company,
              location,
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
      }

      console.log(`Successfully scraped ${jobs.length} jobs from Indeed`)
      return jobs

    } catch (error) {
      console.error('Error scraping Indeed:', error)
      return []
    }
  }

  async scrapeJobDetails(jobUrl: string): Promise<Partial<ScrapedJob> | null> {
    try {
      const response = await axios.get(jobUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      const $ = cheerio.load(response.data)

      const fullDescription = $('#jobDescriptionText').text().trim()
      const requirements = $('.jobsearch-JobRequirements-item').map((i: number, el: any) =>
        $(el).text().trim()
      ).get()

      return {
        description: fullDescription
      }

    } catch (error) {
      console.error('Error scraping Indeed job details:', error)
      return null
    }
  }
}