import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-mock'

// GET - Fetch a single job by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jobId = params.id

    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      )
    }

    const job = await prisma.job.findUnique({
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

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Transform job for frontend with safe property access
    let requirements = []
    try {
      if (job.requirements) {
        requirements = JSON.parse(job.requirements)
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
      salaryMin: job.salaryMin || 0,
      salaryMax: job.salaryMax || 0,
      requirements,
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
      author: {
        name: job.author?.name || 'Unknown Recruiter',
        username: job.author?.username || 'user',
        avatar: job.author?.avatar || '',
        title: job.author?.title || 'Recruiter',
        email: job.author?.email || ''
      }
    }

    return NextResponse.json({
      success: true,
      data: transformedJob
    })
  } catch (error) {
    console.error('Error fetching job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job' },
      { status: 500 }
    )
  }
}
