import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma-mock'
import { EmailService } from '@/lib/email'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    let userId = 'demo-user-1' // Default for demo purposes

    // Try to authenticate if token is provided
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        userId = decoded.userId
      } catch (authError) {
        console.warn('Authentication failed, using demo user:', authError)
        // Continue with demo user
      }
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

    let userId = 'demo-user-1' // Default for demo purposes
    let userEmail = 'demo@example.com'
    let userName = 'Demo User'

    // Try to authenticate if token is provided
    if (token) {
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

        if (user) {
          userEmail = user.email || userEmail
          userName = user.name || user.username || userName
        }
      } catch (authError) {
        console.warn('Authentication failed, using demo user:', authError)
        // Continue with demo user
      }
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
      if (application.job.author.email) {
        await EmailService.sendJobApplicationEmail(
          application.job.author.email,
          userName,
          application.job.title,
          application.job.companyName
        )
      }

      // Send confirmation to applicant
      if (userEmail) {
        await EmailService.sendNotificationEmail(
          userEmail,
          'Application Submitted Successfully',
          `Your application for "${application.job.title}" at ${application.job.companyName} has been submitted successfully. We'll notify you of any updates.`,
          `${process.env.NEXTAUTH_URL}/applications`,
          'View Applications'
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
