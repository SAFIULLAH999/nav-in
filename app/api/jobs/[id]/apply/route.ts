import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma-mock'

export async function POST(
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

    // Get token from authorization header
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    let userId = 'demo-user-1'

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
      userId = decoded.userId
    } catch (error) {
      console.warn('Token verification failed:', error)
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { coverLetter } = body

    // Check if job exists
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        title: true,
        companyName: true,
        location: true,
        type: true,
        isActive: true
      }
    })

    if (!job || !job.isActive) {
      return NextResponse.json(
        { success: false, error: 'Job not found or inactive' },
        { status: 404 }
      )
    }

    // For demo purposes, create a mock application
    const newApplication = {
      id: `app-${Date.now()}`,
      jobId: jobId,
      userId: userId,
      job: {
        title: job.title,
        companyName: job.companyName,
        location: job.location,
        type: job.type
      },
      status: 'pending',
      coverLetter: coverLetter || '',
      appliedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: newApplication,
      message: 'Application submitted successfully!'
    })
  } catch (error) {
    console.error('Error applying for job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to submit application' },
      { status: 500 }
    )
  }
}
