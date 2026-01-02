import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma-mock'

// Mock applications data
const mockApplications = [
  {
    id: 'app-1',
    jobId: 'job-1',
    job: {
      title: 'Senior Frontend Developer',
      companyName: 'TechCorp Inc.',
      location: 'San Francisco, CA',
      type: 'Full-time'
    },
    status: 'pending',
    appliedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    lastUpdated: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 'app-2',
    jobId: 'job-2',
    job: {
      title: 'Product Manager',
      companyName: 'InnovateTech',
      location: 'New York, NY',
      type: 'Full-time'
    },
    status: 'reviewed',
    appliedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    lastUpdated: new Date(Date.now() - 86400000).toISOString()
  }
]

export async function GET(req: NextRequest) {
  try {
    // Try to get token from both header and cookie
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || 
                  req.cookies.get('accessToken')?.value

    // Allow guest access but show demo data
    let userId = 'demo-user-1'
    let isAuthenticated = false

    // Verify authentication token if provided
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        userId = decoded.userId
        isAuthenticated = true
      } catch (authError) {
        console.warn('Authentication failed, using demo data:', authError)
        // Continue with demo data instead of failing
      }
    }

    // For demo purposes, return mock applications
    // In a real app, this would query the database based on userId
    return NextResponse.json({
      success: true,
      data: mockApplications
    })
  } catch (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Try to get token from both header and cookie
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || 
                  req.cookies.get('accessToken')?.value

    let userId = 'demo-user-1'
    let userEmail = 'demo@example.com'
    let userName = 'Demo User'
    let isAuthenticated = false

    // Verify authentication token if provided
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        userId = decoded.userId
        isAuthenticated = true
        
        // Try to get user details (optional)
        try {
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
            userEmail = user.email || ''
            userName = user.name || user.username || 'User'
          }
        } catch (userError) {
          console.warn('Could not fetch user details:', userError)
        }
      } catch (authError) {
        console.warn('Authentication failed, using demo user:', authError)
        // Continue with demo user for guest applications
      }
    }

    // Parse request body
    let jobId: string
    let coverLetter: string

    const contentType = req.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      jobId = formData.get('jobId') as string
      coverLetter = formData.get('coverLetter') as string
    } else {
      const body = await req.json()
      jobId = body.jobId
      coverLetter = body.coverLetter
    }

    // For demo purposes, create a mock application
    const newApplication = {
      id: `app-${Date.now()}`,
      jobId: jobId,
      job: {
        title: 'Software Engineer Position',
        companyName: 'Demo Company',
        location: 'Remote',
        type: 'Full-time'
      },
      status: 'pending',
      appliedAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString()
    }

    // Add to mock applications
    mockApplications.unshift(newApplication)

    // In a real app, this would:
    // 1. Check if job exists
    // 2. Check if user already applied
    // 3. Create application record
    // 4. Send notifications

    return NextResponse.json({
      success: true,
      data: newApplication,
      message: 'Application submitted successfully!'
    })
  } catch (error) {
    console.error('Error creating application:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
