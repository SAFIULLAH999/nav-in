import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const createJobSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description too short').max(10000, 'Description too long'),
  company: z.string().min(1, 'Company name is required').max(100, 'Company name too long'),
  location: z.string().min(1, 'Location is required').max(100, 'Location too long'),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE', 'TEMPORARY']),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
  skills: z.string().optional(),
  experience: z.string().optional(),
  isRemote: z.boolean().default(false),
  applicationDeadline: z.string().datetime().optional(),
})

// GET - Search and filter jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const company = searchParams.get('company') || ''
    const type = searchParams.get('type') || ''
    const offset = (page - 1) * limit

    // Build where clause for filtering
    const where: any = {
      isActive: true
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' }
    }

    if (company) {
      where.company = { contains: company, mode: 'insensitive' }
    }

    if (type) {
      where.type = type
    }

    const jobs = await prisma.job.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
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
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
            isVerified: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    })

    // Transform jobs for frontend
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      description: job.description,
      company: job.company,
      location: job.location,
      type: job.type,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      requirements: job.requirements,
      benefits: job.benefits,
      skills: job.skills,
      experience: job.experience,
      isRemote: job.isRemote,
      applicationDeadline: job.applicationDeadline?.toISOString(),
      views: job.views,
      applicationsCount: job._count.applications,
      createdAt: job.createdAt.toISOString(),
      author: {
        name: job.author.name || 'Unknown Recruiter',
        username: job.author.username || 'user',
        avatar: job.author.avatar || '',
        title: job.author.title || 'Recruiter'
      },
      companyInfo: job.company ? {
        name: job.company.name,
        logo: job.company.logo,
        isVerified: job.company.isVerified
      } : null
    }))

    return NextResponse.json({
      success: true,
      data: transformedJobs,
      pagination: {
        page,
        limit,
        hasMore: jobs.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch jobs' },
      { status: 500 }
    )
  }
}

// POST - Create a new job posting
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
    const jobData = createJobSchema.parse(body)

    const authorId = authResult.user.userId

    // Check if user has recruiter permissions
    if (!['RECRUITER', 'ADMIN', 'COMPANY_ADMIN'].includes(authResult.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to post jobs' },
        { status: 403 }
      )
    }

    // Create the job
    const newJob = await prisma.job.create({
      data: {
        title: jobData.title,
        description: jobData.description,
        company: jobData.company,
        location: jobData.location,
        type: jobData.type,
        salaryMin: jobData.salaryMin,
        salaryMax: jobData.salaryMax,
        requirements: jobData.requirements,
        benefits: jobData.benefits,
        skills: jobData.skills,
        experience: jobData.experience,
        isRemote: jobData.isRemote,
        applicationDeadline: jobData.applicationDeadline ? new Date(jobData.applicationDeadline) : null,
        authorId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
          }
        }
      }
    })

    // Transform for frontend response
    const transformedJob = {
      id: newJob.id,
      title: newJob.title,
      description: newJob.description,
      company: newJob.company,
      location: newJob.location,
      type: newJob.type,
      salaryMin: newJob.salaryMin,
      salaryMax: newJob.salaryMax,
      requirements: newJob.requirements,
      benefits: newJob.benefits,
      skills: newJob.skills,
      experience: newJob.experience,
      isRemote: newJob.isRemote,
      applicationDeadline: newJob.applicationDeadline?.toISOString(),
      views: newJob.views,
      applicationsCount: newJob.applicationsCount,
      createdAt: newJob.createdAt.toISOString(),
      author: {
        name: newJob.author.name || 'Unknown Recruiter',
        username: newJob.author.username || 'user',
        avatar: newJob.author.avatar || '',
        title: newJob.author.title || 'Recruiter'
      }
    }

    return NextResponse.json({
      success: true,
      data: transformedJob,
      message: 'Job posted successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create job' },
      { status: 500 }
    )
  }
}
