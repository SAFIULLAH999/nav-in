import { NextRequest, NextResponse } from 'next/server';
import { enhancedJobScraper } from '@/lib/job-scrapers/enhanced-job-scraper';

// POST /api/scraping/trigger - Trigger job scraping from multiple sources
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sources } = body; // Optional array of specific sources to scrape

    console.log('Starting job scraping from sources:', sources || 'all');

    // Run scraping in background
    const scrapePromise = enhancedJobScraper.scrapeFromMultipleSources(sources);

    // Don't await - let it run in background
    scrapePromise.then((results) => {
      console.log('Scraping completed:', results);
    }).catch((error) => {
      console.error('Scraping failed:', error);
    });

    return NextResponse.json({
      message: 'Job scraping started',
      sources: sources || 'all',
      status: 'running',
    });
  } catch (error) {
    console.error('Error triggering job scraping:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}