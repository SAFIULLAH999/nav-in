import { prisma } from '@/lib/prisma';
import { JobSource, ScrapingSession, JobScrapingQueue } from '@prisma/client';
import { IndeedScraper } from './indeed-scraper';

export interface ScrapedJob {
  title: string;
  company: string;
  location: string;
  description: string;
  type: string;
  salaryMin?: number | null;
  salaryMax?: number | null;
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
  private indeedScraper = new IndeedScraper();

  async scrapeFromMultipleSources(sources?: string[]) {
    const activeSources = await prisma.jobSource.findMany({
      where: {
        isActive: true,
        ...(sources && { name: { in: sources } }),
      },
    });

    const results = [];
    let session: ScrapingSession | null = null;

    for (const source of activeSources) {
      try {
        session = await this.createScrapingSession(source.id);

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
          await this.completeScrapingSession(session.id, 'FAILED', 0, 0, 0, 1, error instanceof Error ? error.message : 'Unknown error');
        }

        results.push({
          source: source.name,
          jobsFound: 0,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
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
        createdBy: 'system',
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
    console.log('LinkedIn scraping skipped due to anti-scraping measures');
    return [];
  }

  private async scrapeIndeed(source: JobSource): Promise<ScrapedJob[]> {
    const config = source.config ? JSON.parse(source.config as string) : {};
    const searchQuery = config.searchQuery || 'software engineer';
    const location = config.location || 'remote';
    const limit = config.limit || 50;

    console.log(`Scraping Indeed for: ${searchQuery} in ${location}`);
    const scrapedJobs = await this.indeedScraper.scrapeJobs(searchQuery, location, limit);

    return scrapedJobs.map((job) => ({
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      type: this.normalizeJobType(job.jobType),
      salaryMin: job.salary ? this.parseSalary(job.salary).min : undefined,
      salaryMax: job.salary ? this.parseSalary(job.salary).max : undefined,
      requirements: this.extractRequirements(job.description),
      experience: this.extractExperience(job.title, job.description),
      sourceUrl: job.applyUrl,
      sourceId: job.externalId,
      isRemote: this.detectRemote(job.location, job.description),
      applicationDeadline: this.calculateDeadline(job.postedDate),
    }));
  }

  private async scrapeGlassdoor(source: JobSource): Promise<ScrapedJob[]> {
    console.log('Glassdoor scraping not yet implemented');
    return [];
  }

  private async scrapeGreenhouse(source: JobSource): Promise<ScrapedJob[]> {
    console.log('Greenhouse scraping not yet implemented');
    return [];
  }

  private async processScrapedJob(job: ScrapedJob, sourceId: string, sessionId: string) {
    const existingJob = await prisma.job.findFirst({
      where: {
        sourceId: job.sourceId,
      },
    });

    const source = job.sourceId.startsWith('linkedin') ? 'LINKEDIN' :
                   job.sourceId.startsWith('indeed') ? 'INDEED' :
                   job.sourceId.startsWith('glassdoor') ? 'GLASSDOOR' :
                   job.sourceId.startsWith('greenhouse') ? 'GREENHOUSE' : 'MANUAL';

    if (existingJob) {
      await prisma.job.update({
        where: { id: existingJob.id },
        data: {
          title: job.title,
          description: job.description,
          companyName: job.company,
          location: job.location,
          type: job.type,
          salaryMin: job.salaryMin ?? null,
          salaryMax: job.salaryMax ?? null,
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
      await prisma.job.create({
        data: {
          title: job.title,
          description: job.description,
          companyName: job.company,
          location: job.location,
          type: job.type,
          salaryMin: job.salaryMin ?? null,
          salaryMax: job.salaryMax ?? null,
          requirements: JSON.stringify(job.requirements || []),
          benefits: job.benefits,
          experience: job.experience,
          isRemote: job.isRemote,
          sourceUrl: job.sourceUrl,
          sourceId: job.sourceId,
          source,
          isScraped: true,
          lastScraped: new Date(),
          authorId: 'system',
        },
      });
    }
  }

  private normalizeJobType(jobType: string): string {
    const normalized = jobType.toLowerCase();
    if (normalized.includes('full') || normalized.includes('permanent')) return 'FULL_TIME';
    if (normalized.includes('part')) return 'PART_TIME';
    if (normalized.includes('contract')) return 'CONTRACT';
    if (normalized.includes('intern')) return 'INTERNSHIP';
    if (normalized.includes('freelance')) return 'FREELANCE';
    if (normalized.includes('temp')) return 'TEMPORARY';
    return 'FULL_TIME';
  }

  private parseSalary(salary: string): { min: number | null; max: number | null } {
    const cleanSalary = salary.replace(/[$,]/g, '').toLowerCase();
    const rangeMatch = cleanSalary.match(/(\d+)\s*[-–to]+\s*(\d+)/);
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1]) * 1000;
      const max = parseInt(rangeMatch[2]) * 1000;
      return { min, max };
    }
    const singleMatch = cleanSalary.match(/(\d+)/);
    if (singleMatch) {
      const amount = parseInt(singleMatch[1]) * 1000;
      return { min: amount, max: amount };
    }
    return { min: null, max: null };
  }

  private extractRequirements(description: string): string[] {
    const requirements: string[] = [];
    const sentences = description.split(/[.!?]+/);
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (
        lower.includes('require') ||
        lower.includes('must have') ||
        lower.includes('experience with') ||
        lower.includes('knowledge of') ||
        lower.includes('proficiency in')
      ) {
        requirements.push(sentence.trim());
      }
    }
    return requirements.slice(0, 10);
  }

  private extractExperience(title: string, description: string): string {
    const text = `${title} ${description}`.toLowerCase();
    if (text.includes('senior') || text.includes('lead') || text.includes('principal') || text.includes('head')) {
      return 'SENIOR';
    } else if (text.includes('junior') || text.includes('entry') || text.includes('graduate') || text.includes('intern')) {
      return 'JUNIOR';
    } else if (text.includes('mid') || text.includes('intermediate') || text.includes('3+') || text.includes('5+')) {
      return 'MID';
    }
    return 'MID';
  }

  private detectRemote(location: string, description: string): boolean {
    const text = `${location} ${description}`.toLowerCase();
    return text.includes('remote') || text.includes('work from home') || text.includes('wfh') || text.includes('telecommute');
  }

  private calculateDeadline(postedDate: string): Date {
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 30);
    return deadline;
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
              error: error instanceof Error ? error.message : 'Unknown error',
              processedAt: new Date(),
            },
          });
        } else {
          await prisma.jobScrapingQueue.update({
            where: { id: item.id },
            data: {
              attempts: currentAttempts,
              scheduledFor: new Date(Date.now() + currentAttempts * 60000),
            },
          });
        }
      }
    }
  }

  private async processQueueItem(item: JobScrapingQueue) {
    console.log(`Processing queue item: ${item.url}`);
  }
}

export const enhancedJobScraper = new EnhancedJobScraper();