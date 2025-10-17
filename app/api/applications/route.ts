import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const submitApplicationSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  resume: z.string().url().optional(),
  coverLetter: z.string().max(2000, 'Cover letter too long').optional()
})

// GET - Get user's applications
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const userId = authResult.user.userId
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const applications = await prisma.application.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      orderBy: { appliedAt: 'desc' },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            location: true,
            type: true,
            isActive: true,
            author: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
              }
            }
          }
        }
      }
    })

    // Transform applications for frontend
    const transformedApplications = applications.map(app => ({
      id: app.id,
      status: app.status,
      resume: app.resume,
      coverLetter: app.coverLetter,
      appliedAt: app.appliedAt.toISOString(),
      job: {
        id: app.job.id,
        title: app.job.title,
        company: app.job.company,
        location: app.job.location,
        type: app.job.type,
        isActive: app.job.isActive,
        recruiter: {
          name: app.job.author.name || 'Unknown Recruiter',
          username: app.job.author.username || 'user',
          avatar: app.job.author.avatar || ''
        }
      }
    }))

    return NextResponse.json({
      success: true,
      data: transformedApplications,
      pagination: {
        page,
        limit,
        hasMore: applications.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch applications' },
      { status: 500 }
    )
  }
}

// POST - Submit job application
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { jobId, resume, coverLetter } = submitApplicationSchema.parse(body)

    const userId = authResult.user.userId

    // Check if job exists and is active
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    })

    if (!job || !job.isActive) {
      return NextResponse.json(
        { success: false, error: 'Job not found or no longer active' },
        { status: 404 }
      )
    }

    // Check if user already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId
        }
      }
    })

    if (existingApplication) {
      return NextResponse.json(
        { success: false, error: 'Already applied to this job' },
        { status: 400 }
      )
    }

    // Check application deadline
    if (job.applicationDeadline && job.applicationDeadline < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Application deadline has passed' },
        { status: 400 }
      )
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        userId,
        jobId,
        resume,
        coverLetter
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true,
            authorId: true
          }
        }
      }
    })

    // Update job application count
    await prisma.job.update({
      where: { id: jobId },
      data: {
        applicationsCount: {
          increment: 1
        }
      }
    })

    // Create notification for recruiter
    await prisma.notification.create({
      data: {
        userId: job.authorId,
        type: 'JOB_APPLICATION',
        title: 'New Job Application',
        message: `Someone applied for "${job.title}" at ${job.company}`,
        data: JSON.stringify({
          applicationId: application.id,
          jobId: jobId,
          applicantId: userId
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: application.id,
        status: application.status,
        appliedAt: application.appliedAt.toISOString(),
        job: {
          id: application.job.id,
          title: application.job.title,
          company: application.job.company
        }
      },
      message: 'Application submitted successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error submitting application:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}
