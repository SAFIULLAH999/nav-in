import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'
import { EnhancedJobScraperManager } from '@/lib/job-scrapers/enhanced-scraper-manager'
import { JobQueueManager } from '@/lib/queue/job-queue-manager'
import { RateLimitManager } from '@/lib/rate-limiting/rate-limit-manager'

const scrapingSchema = z.object({
  searchQuery: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
  location: z.string().min(1, 'Location is required').max(100, 'Location too long'),
  limit: z.number().min(1).max(500).default(50),
  sources: z.array(z.enum(['indeed', 'linkedin'])).min(1, 'At least one source is required'),
  priority: z.enum(['low', 'normal', 'high']).default('normal'),
  schedule: z.string().optional() // cron expression for scheduled scraping
})

const scraperManager = new EnhancedJobScraperManager()
const queueManager = new JobQueueManager()
const rateLimitManager = new RateLimitManager()

// GET - Get scraping statistics and status
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    // Check if user has permission to view scraping stats
    if (!['ADMIN', 'RECRUITER'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const stats = await scraperManager.getScrapingStats()
    const queueStats = await queueManager.getQueueStats()

    return NextResponse.json({
      success: true,
      data: {
        scraping: stats,
        queue: queueStats
      }
    })

  } catch (error) {
    console.error('Error getting scraping stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get scraping statistics' },
      { status: 500 }
    )
  }
}

// POST - Trigger job scraping
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    // Rate limiting check
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await rateLimitManager.checkLimit(clientIP, 'scraping')

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.retryAfter
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const scrapingData = scrapingSchema.parse(body)

    // Check if user has permission to trigger scraping
    if (!['ADMIN', 'RECRUITER'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to trigger scraping' },
        { status: 403 }
      )
    }

    const scrapingConfig = {
      searchQuery: scrapingData.searchQuery,
      location: scrapingData.location,
      limit: scrapingData.limit,
      sources: scrapingData.sources,
      priority: scrapingData.priority,
      schedule: scrapingData.schedule
    }

    let result

    if (scrapingData.schedule) {
      // Schedule the scraping job
      const jobId = await queueManager.addJob({
        type: 'scheduled_scraping',
        data: JSON.stringify(scrapingConfig),
        priority: scrapingData.priority === 'high' ? 10 : scrapingData.priority === 'normal' ? 5 : 1,
        scheduledFor: new Date() // Run immediately for now, scheduler will handle cron
      })

      result = {
        jobId,
        type: 'scheduled',
        message: `Scraping job scheduled with ID: ${jobId}`
      }
    } else {
      // Run scraping immediately
      result = await scraperManager.scrapeJobsWithConfig(scrapingConfig)
    }

    // Log the scraping request
    await rateLimitManager.logRequest(clientIP, 'scraping', true)

    return NextResponse.json({
      success: true,
      data: result,
      message: scrapingData.schedule
        ? 'Scraping job scheduled successfully'
        : 'Scraping completed successfully'
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in scraping request:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process scraping request' },
      { status: 500 }
    )
  }
}