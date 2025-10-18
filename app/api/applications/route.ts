import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    const applications = await prisma.application.findMany({
      where: { userId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            companyName: true,
            location: true,
            type: true
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: applications.map(app => ({
        id: app.id,
        jobId: app.jobId,
        job: app.job,
        status: app.status,
        appliedAt: app.appliedAt.toISOString(),
        lastUpdated: app.appliedAt.toISOString(),
        notes: null // Could be extended to include application notes
      }))
    })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    const { jobId, resume, coverLetter } = await req.json()

    // Check if job exists
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

    if (existingApplication) {
      return NextResponse.json({ error: 'Already applied to this job' }, { status: 400 })
    }

    const application = await prisma.application.create({
      data: {
        userId,
        jobId,
        resume,
        coverLetter,
        status: 'PENDING'
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            companyName: true,
            location: true,
            type: true
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

    return NextResponse.json({
      success: true,
      data: {
        id: application.id,
        jobId: application.jobId,
        job: application.job,
        status: application.status,
        appliedAt: application.appliedAt.toISOString(),
        lastUpdated: application.appliedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Error creating application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
