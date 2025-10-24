import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
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

    // Transform job for frontend
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
      id: job.id,
      title: job.title,
      description: job.description,
      company: job.companyName,
      companyName: job.companyName,
      location: job.location,
      type: job.type,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      requirements,
      benefits: job.benefits,
      experience: job.experience,
      isRemote: job.isRemote,
      applicationDeadline: job.applicationDeadline?.toISOString(),
      views: job.views,
      applicationsCount: job._count.applications,
      createdAt: job.createdAt.toISOString(),
      author: {
        name: job.author?.name || 'Unknown Recruiter',
        username: job.author?.username || 'user',
        avatar: job.author?.avatar || '',
        title: job.author?.title || 'Recruiter'
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
