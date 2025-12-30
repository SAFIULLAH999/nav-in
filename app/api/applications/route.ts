import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma-mock'
import { EmailService } from '@/lib/email'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    // Check if user is authenticated
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let userId: string
    let userEmail: string
    let userName: string

    // Verify authentication token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
      userId = decoded.userId
      
      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true
        }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 })
      }

      userEmail = user.email || ''
      userName = user.name || user.username || 'User'
    } catch (authError) {
      console.warn('Authentication failed:', authError)
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

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

    // Check if user is authenticated
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    let userId: string
    let userEmail: string
    let userName: string

    // Verify authentication token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
      userId = decoded.userId

      // Get user details
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          username: true
        }
      })

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 401 })
      }

      userEmail = user.email || 'demo@example.com'
      userName = user.name || user.username || 'User'
    } catch (authError) {
      console.warn('Authentication failed:', authError)
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 })
    }

    // Check if request is FormData (for file uploads)
    const contentType = req.headers.get('content-type') || ''
    let jobId: string
    let coverLetter: string
    let resume: string | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      jobId = formData.get('jobId') as string
      coverLetter = formData.get('coverLetter') as string
      const resumeFile = formData.get('resume') as File | null

      // In a real app, you'd upload the file to a service like Cloudinary or S3
      // For now, we'll just store the filename or URL
      if (resumeFile) {
        resume = `Uploaded: ${resumeFile.name}` // Placeholder
      }
    } else {
      const body = await req.json()
      jobId = body.jobId
      coverLetter = body.coverLetter
      resume = body.resume
    }

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

    // User details are already fetched above, so we can use them directly

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
            type: true,
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                username: true
              }
            }
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

    // Send emails
    try {
      // Send notification to employer
      if (application.job && application.job.author && application.job.author.email) {
        await EmailService.sendJobApplicationEmail(
          application.job.author.email,
          userName,
          application.job.title,
          application.job.companyName
        )
      }

      // Send confirmation to applicant
      if (userEmail) {
        await EmailService.sendJobApplicationConfirmationEmail(
          userEmail,
          userName,
          application.job?.title || 'Job Title',
          application.job?.companyName || 'Company',
          application.job?.author?.email || 'employer@example.com',
          undefined, // employerPhone - could be added later
          application.job?.author?.name || 'Employer'
        )
      }
    } catch (emailError) {
      console.error('Error sending application emails:', emailError)
      // Don't fail the application if email fails
    }

    // Trigger new job fetching after successful application (optional feature)
    try {
      // Mock job fetching function that doesn't fail if backend isn't available
      const mockJobFetching = async () => {
        console.log('Job fetching scheduled (mock) after successful application')
        return null
      }
      await mockJobFetching()
    } catch (fetchError) {
      console.error('Error scheduling job fetching after application:', fetchError)
      // Don't fail the application if job fetching fails
    }

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
