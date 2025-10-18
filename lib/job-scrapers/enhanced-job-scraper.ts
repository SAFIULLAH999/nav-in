import { prisma } from '@/lib/prisma';
import { JobSource, ScrapingSession, JobScrapingQueue } from '@prisma/client';

export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  type: string;
  salaryMin?: number;
  salaryMax?: number;
  requirements?: string[];
  benefits?: string;
  experience?: string;
  sourceUrl: string;
  sourceId: string;
  isRemote: boolean;
  applicationDeadline?: Date;
}

export class EnhancedJobScraper {
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map();

  async scrapeFromMultipleSources(sources?: string[]) {
    const activeSources = await prisma.jobSource.findMany({
      where: {
        isActive: true,
        ...(sources && { name: { in: sources } }),
      },
    });

    const results = [];

    for (const source of activeSources) {
      try {
        const session = await this.createScrapingSession(source.id);

        const jobs = await this.scrapeSource(source, session.id);

        await this.completeScrapingSession(session.id, 'COMPLETED', jobs.length, jobs.length, 0, 0);

        results.push({
          source: source.name,
          jobsFound: jobs.length,
          success: true,
        });
      } catch (error) {
        console.error(`Error scraping ${source.name}:`, error);

        if (session) {
          await this.completeScrapingSession(session.id, 'FAILED', 0, 0, 0, 1, error.message);
        }

        results.push({
          source: source.name,
          jobsFound: 0,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }

  private async createScrapingSession(sourceId: string): Promise<ScrapingSession> {
    return await prisma.scrapingSession.create({
      data: {
        sourceId,
        status: 'RUNNING',
        createdBy: 'system', // System-initiated scraping
      },
    });
  }

  private async completeScrapingSession(
    sessionId: string,
    status: string,
    jobsFound: number,
    jobsCreated: number,
    jobsUpdated: number,
    jobsFailed: number,
    errorMessage?: string
  ) {
    await prisma.scrapingSession.update({
      where: { id: sessionId },
      data: {
        status,
        jobsFound,
        jobsCreated,
        jobsUpdated,
        jobsFailed,
        errorMessage,
        completedAt: new Date(),
      },
    });
  }

  private async scrapeSource(source: JobSource, sessionId: string): Promise<ScrapedJob[]> {
    const jobs: ScrapedJob[] = [];

    switch (source.name) {
      case 'LinkedIn':
        jobs.push(...await this.scrapeLinkedIn(source));
        break;
      case 'Indeed':
        jobs.push(...await this.scrapeIndeed(source));
        break;
      case 'Glassdoor':
        jobs.push(...await this.scrapeGlassdoor(source));
        break;
      case 'Greenhouse':
        jobs.push(...await this.scrapeGreenhouse(source));
        break;
      default:
        console.log(`No scraper available for ${source.name}`);
    }

    // Process and store jobs
    for (const job of jobs) {
      try {
        await this.processScrapedJob(job, source.id, sessionId);
      } catch (error) {
        console.error('Error processing job:', error);
      }
    }

    return jobs;
  }

  private async scrapeLinkedIn(source: JobSource): Promise<ScrapedJob[]> {
    // LinkedIn scraping implementation
    // This would use puppeteer or similar to scrape LinkedIn jobs
    console.log('Scraping LinkedIn jobs...');

    // Placeholder implementation
    return [
      {
        title: 'Senior Software Engineer',
        company: 'Tech Corp',
        location: 'San Francisco, CA',
        description: 'We are looking for a senior software engineer...',
        type: 'FULL_TIME',
        salaryMin: 120000,
        salaryMax: 180000,
        sourceUrl: 'https://linkedin.com/jobs/123',
        sourceId: 'linkedin-123',
        isRemote: true,
      },
    ];
  }

  private async scrapeIndeed(source: JobSource): Promise<ScrapedJob[]> {
    // Indeed scraping implementation
    console.log('Scraping Indeed jobs...');

    // Placeholder implementation
    return [
      {
        title: 'Product Manager',
        company: 'ProductCorp',
        location: 'New York, NY',
        description: 'Join our product team...',
        type: 'FULL_TIME',
        salaryMin: 100000,
        salaryMax: 140000,
        sourceUrl: 'https://indeed.com/jobs/456',
        sourceId: 'indeed-456',
        isRemote: false,
      },
    ];
  }

  private async scrapeGlassdoor(source: JobSource): Promise<ScrapedJob[]> {
    // Glassdoor scraping implementation
    console.log('Scraping Glassdoor jobs...');

    // Placeholder implementation
    return [
      {
        title: 'UX Designer',
        company: 'DesignStudio',
        location: 'Austin, TX',
        description: 'Create amazing user experiences...',
        type: 'FULL_TIME',
        salaryMin: 80000,
        salaryMax: 120000,
        sourceUrl: 'https://glassdoor.com/jobs/789',
        sourceId: 'glassdoor-789',
        isRemote: true,
      },
    ];
  }

  private async scrapeGreenhouse(source: JobSource): Promise<ScrapedJob[]> {
    // Greenhouse scraping implementation (via API if available)
    console.log('Scraping Greenhouse jobs...');

    // Placeholder implementation
    return [
      {
        title: 'DevOps Engineer',
        company: 'CloudTech',
        location: 'Seattle, WA',
        description: 'Build scalable infrastructure...',
        type: 'FULL_TIME',
        salaryMin: 110000,
        salaryMax: 160000,
        sourceUrl: 'https://greenhouse.com/jobs/101',
        sourceId: 'greenhouse-101',
        isRemote: false,
      },
    ];
  }

  private async processScrapedJob(job: ScrapedJob, sourceId: string, sessionId: string) {
    // Check if job already exists
    const existingJob = await prisma.job.findFirst({
      where: {
        sourceId: job.sourceId,
        source: job.sourceId.startsWith('linkedin') ? 'LINKEDIN' :
                job.sourceId.startsWith('indeed') ? 'INDEED' :
                job.sourceId.startsWith('glassdoor') ? 'GLASSDOOR' :
                job.sourceId.startsWith('greenhouse') ? 'GREENHOUSE' : 'MANUAL',
      },
    });

    if (existingJob) {
      // Update existing job
      await prisma.job.update({
        where: { id: existingJob.id },
        data: {
          title: job.title,
          description: job.description,
          companyName: job.company,
          location: job.location,
          type: job.type,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          requirements: JSON.stringify(job.requirements || []),
          benefits: job.benefits,
          experience: job.experience,
          isRemote: job.isRemote,
          sourceUrl: job.sourceUrl,
          lastScraped: new Date(),
          isActive: true,
        },
      });
    } else {
      // Create new job
      await prisma.job.create({
        data: {
          title: job.title,
          description: job.description,
          companyName: job.company,
          location: job.location,
          type: job.type,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          requirements: JSON.stringify(job.requirements || []),
          benefits: job.benefits,
          experience: job.experience,
          isRemote: job.isRemote,
          sourceUrl: job.sourceUrl,
          sourceId: job.sourceId,
          source: job.sourceId.startsWith('linkedin') ? 'LINKEDIN' :
                  job.sourceId.startsWith('indeed') ? 'INDEED' :
                  job.sourceId.startsWith('glassdoor') ? 'GLASSDOOR' :
                  job.sourceId.startsWith('greenhouse') ? 'GREENHOUSE' : 'MANUAL',
          isScraped: true,
          lastScraped: new Date(),
          authorId: 'system', // System-created job
        },
      });
    }
  }

  async scheduleScraping(sourceName: string, url: string, priority = 0) {
    const source = await prisma.jobSource.findFirst({
      where: { name: sourceName, isActive: true },
    });

    if (!source) {
      throw new Error(`Source ${sourceName} not found or inactive`);
    }

    await prisma.jobScrapingQueue.create({
      data: {
        sourceId: source.id,
        url,
        priority,
        createdBy: 'system',
      },
    });
  }

  async processScrapingQueue() {
    const queueItems = await prisma.jobScrapingQueue.findMany({
      where: {
        status: 'PENDING',
        scheduledFor: {
          lte: new Date(),
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: 10,
    });

    for (const item of queueItems) {
      try {
        await prisma.jobScrapingQueue.update({
          where: { id: item.id },
          data: { status: 'PROCESSING' },
        });

        // Process the scraping item
        await this.processQueueItem(item);

        await prisma.jobScrapingQueue.update({
          where: { id: item.id },
          data: {
            status: 'COMPLETED',
            processedAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Error processing queue item:', error);

        const currentAttempts = item.attempts + 1;
        if (currentAttempts >= item.maxAttempts) {
          await prisma.jobScrapingQueue.update({
            where: { id: item.id },
            data: {
              status: 'FAILED',
              attempts: currentAttempts,
              error: error.message,
              processedAt: new Date(),
            },
          });
        } else {
          await prisma.jobScrapingQueue.update({
            where: { id: item.id },
            data: {
              attempts: currentAttempts,
              scheduledFor: new Date(Date.now() + currentAttempts * 60000), // Exponential backoff
            },
          });
        }
      }
    }
  }

  private async processQueueItem(item: JobScrapingQueue) {
    // Implementation for processing individual queue items
    console.log(`Processing queue item: ${item.url}`);
  }
}

export const enhancedJobScraper = new EnhancedJobScraper();