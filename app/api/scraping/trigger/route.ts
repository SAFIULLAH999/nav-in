import { NextRequest, NextResponse } from 'next/server';
import { JobScraperManager } from '@/lib/job-scrapers/scraper-manager';

const scraperManager = new JobScraperManager();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const searchQuery = body.searchQuery || 'software engineer';
    const location = body.location || 'remote';
    const limit = body.limit || 100;

    console.log(`Triggering job scraping: ${searchQuery} in ${location}, limit ${limit}`);

    const jobs = await scraperManager.scrapeAllJobs(searchQuery, location, limit);

    return NextResponse.json({
      success: true,
      message: `Scraped ${jobs.length} jobs`,
      jobsFound: jobs.length,
      sample: jobs.slice(0, 5).map(job => ({
        title: job.title,
        company: job.company,
        location: job.location,
        applyUrl: job.applyUrl,
      })),
    });
  } catch (error) {
    console.error('Error triggering job scraping:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}