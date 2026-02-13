import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    const body = await req.json()
    const {
      jobId,
      resume,
      coverLetter,
      answers,
      customQuestions
    } = body

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    if (!job.isEasyApply) {
      return NextResponse.json({ error: 'This job does not support Easy Apply' }, { status: 400 })
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
      return NextResponse.json({ error: 'You have already applied to this job' }, { status: 400 })
    }

    // Validate required fields
    if (job.requiresResume && !resume) {
      return NextResponse.json({ error: 'Resume is required for this job' }, { status: 400 })
    }

    if (job.requiresCoverLetter && !coverLetter) {
      return NextResponse.json({ error: 'Cover letter is required for this job' }, { status: 400 })
    }

    // Validate custom questions if provided
    if (job.applicationQuestions) {
      const requiredQuestions = JSON.parse(job.applicationQuestions)
      const requiredQuestionIds = requiredQuestions
        .filter((q: any) => q.isRequired)
        .map((q: any) => q.id)

      const providedAnswers = answers || {}
      const missingAnswers = requiredQuestionIds.filter((id: string) => !providedAnswers[id])

      if (missingAnswers.length > 0) {
        return NextResponse.json({ 
          error: 'Missing required application answers',
          missingQuestions: missingAnswers
        }, { status: 400 })
      }
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        userId,
        jobId,
        resume: resume || null,
        coverLetter: coverLetter || null,
        status: 'PENDING'
      }
    })

    // Create application metadata for custom answers
    if (answers && Object.keys(answers).length > 0) {
      await prisma.application.update({
        where: { id: application.id },
        data: {
          // Store custom answers as JSON in a separate field or table
          // For now, we'll store in a metadata field if it exists
          // or create a separate ApplicationAnswer model
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        status: application.status,
        appliedAt: application.appliedAt
      }
    })
  } catch (error) {
    console.error('Error submitting application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Get job details
    const job = await prisma.job.findUnique({
      where: { id: jobId }
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
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

    // Parse application questions
    const applicationQuestions = job.applicationQuestions 
      ? JSON.parse(job.applicationQuestions) 
      : []

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        isEasyApply: job.isEasyApply,
        applicationMethod: job.applicationMethod,
        requiresResume: job.requiresResume,
        requiresCoverLetter: job.requiresCoverLetter,
        applicationQuestions,
        hasApplied: !!existingApplication,
        applicationStatus: existingApplication?.status
      }
    })
  } catch (error) {
    console.error('Error fetching application info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    const body = await req.json()
    const { jobId, status } = body

    if (!jobId || !status) {
      return NextResponse.json({ error: 'Job ID and status are required' }, { status: 400 })
    }

    // Check if application exists and belongs to user
    const application = await prisma.application.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId
        }
      }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id: application.id },
      data: { status }
    })

    return NextResponse.json({
      success: true,
      message: 'Application status updated successfully',
      application: {
        id: updatedApplication.id,
        status: updatedApplication.status
      }
    })
  } catch (error) {
    console.error('Error updating application status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}