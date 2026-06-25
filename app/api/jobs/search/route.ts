import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { JobScraperManager } from '@/lib/job-scrapers/scraper-manager'

const scraperManager = new JobScraperManager()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchQuery, location, limit = 20, page = 1 } = body

    // First, trigger scraping for new jobs
    console.log(`Search trigger: scraping new jobs for ${searchQuery} in ${location}`)
    await scraperManager.scrapeAllJobs(searchQuery || 'software engineer', location || 'remote', limit || 100)

    // Then query the database for results
    const skip = (page - 1) * limit

    const where: any = {
      isActive: true,
      validityStatus: 'VALID',
    }

    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { companyName: { contains: searchQuery, mode: 'insensitive' } },
      ]
    }

    if (location && location !== 'remote') {
      where.location = { contains: location, mode: 'insensitive' }
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          companyName: true,
          location: true,
          type: true,
          salaryMin: true,
          salaryMax: true,
          requirements: true,
          benefits: true,
          experience: true,
          isRemote: true,
          applicationDeadline: true,
          sourceUrl: true,
          source: true,
          isScraped: true,
          views: true,
          applicationsCount: true,
          createdAt: true,
        }
      }),
      prisma.job.count({ where })
    ])

    const transformedJobs = jobs.map((job: any) => ({
      id: job.id,
      title: job.title,
      description: job.description,
      companyName: job.companyName,
      location: job.location,
      type: job.type,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      requirements: job.requirements ? JSON.parse(job.requirements) : [],
      benefits: job.benefits,
      experience: job.experience,
      isRemote: job.isRemote,
      applicationDeadline: job.applicationDeadline?.toISOString(),
      sourceUrl: job.sourceUrl,
      source: job.source,
      isScraped: job.isScraped,
      views: job.views,
      applicationsCount: job.applicationsCount,
      createdAt: job.createdAt.toISOString(),
      author: {
        name: job.companyName,
        username: job.companyName?.toLowerCase().replace(/\s+/g, '-'),
        avatar: '',
        title: 'Hiring Manager'
      }
    }))

    return NextResponse.json({
      success: true,
      data: transformedJobs,
      meta: {
        hasMore: total > skip + jobs.length,
        page,
        total,
        limit
      }
    })
  } catch (error) {
    console.error('Error searching jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search jobs' },
      { status: 500 }
    )
  }
}