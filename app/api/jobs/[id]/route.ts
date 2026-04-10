import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cacheGet, cacheSet, cacheDelete } from '@/lib/redis'

// GET - Fetch a single job by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const jobId = params.id

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = `jobs:job:${jobId}`
    const cached = await cacheGet(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    let job = null
    
    try {
      job = await prisma.job.findUnique({
        where: { id: jobId, isActive: true },
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
          views: true,
          applicationsCount: true,
          createdAt: true,
          employerEmail: true,
          employerPhone: true,
          employerUsername: true,
          employerName: true,
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              title: true,
              email: true,
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        }
      })
    } catch (error) {
      console.error('Database unavailable:', error)
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Transform job for frontend with safe property access
    let requirements = []
    try {
      if (job.requirements && typeof job.requirements === 'string') {
        requirements = JSON.parse(job.requirements)
      } else if (Array.isArray(job.requirements)) {
        requirements = job.requirements
      }
    } catch (e) {
      // If parsing fails, treat as a single requirement string
      requirements = job.requirements ? [job.requirements] : []
    }

    const transformedJob = {
      id: job.id || '',
      title: job.title || '',
      description: job.description || '',
      company: job.companyName || '',
      companyName: job.companyName || '',
      location: job.location || '',
      type: job.type || '',
      salaryMin: job.salaryMin || null,
      salaryMax: job.salaryMax || null,
      requirements: Array.isArray(requirements) ? requirements : [],
      benefits: job.benefits || '',
      experience: job.experience || '',
      isRemote: job.isRemote || false,
      applicationDeadline: job.applicationDeadline ? job.applicationDeadline.toISOString() : null,
      views: job.views || 0,
      applicationsCount: job._count?.applications || 0,
      createdAt: job.createdAt ? job.createdAt.toISOString() : new Date().toISOString(),
      employerEmail: job.employerEmail || '',
      employerPhone: job.employerPhone || '',
      employerUsername: job.employerUsername || '',
      employerName: job.employerName || '',
      author: job.author ? {
        name: job.author.name || 'Unknown Recruiter',
        username: job.author.username || 'user',
        avatar: job.author.avatar || '',
        title: job.author.title || 'Recruiter',
        email: job.author.email || ''
      } : {
        name: 'Unknown Recruiter',
        username: 'user',
        avatar: '',
        title: 'Recruiter',
        email: ''
      }
    }

    const response = {
      success: true,
      data: transformedJob
    }

    // Cache for 10 minutes
    await cacheSet(cacheKey, response, 600)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job' },
      { status: 500 }
    )
  }
}
