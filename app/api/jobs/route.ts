import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createJobSchema = z.object({
  title: z.string().min(1, 'Job title is required').max(200, 'Title too long'),
  description: z.string().min(10, 'Description too short').max(10000, 'Description too long'),
  companyName: z.string().min(1, 'Company name is required').max(100, 'Company name too long'),
  location: z.string().min(1, 'Location is required').max(100, 'Location too long'),
  type: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE', 'TEMPORARY']),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  requirements: z.string().optional(),
  benefits: z.string().optional(),
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
        { title: { contains: search } },
        { description: { contains: search } },
        { companyName: { contains: search } },
        { requirements: { contains: search } },
        { benefits: { contains: search } }
      ]
    }

    if (location) {
      where.location = { contains: location }
    }

    if (company) {
      where.companyName = { contains: company }
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
      companyName: job.companyName,
      location: job.location,
      type: job.type,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      requirements: job.requirements ? JSON.parse(job.requirements) : [],
      benefits: job.benefits,
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
      companyInfo: null
    }))

    return NextResponse.json(transformedJobs)
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json([])
  }
}

// POST - Create a new job posting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const jobData = createJobSchema.parse(body)

    // For demo purposes, create job without authentication
    const authorId = 'demo-user-id' // This should be replaced with proper auth

    // Skip role checking for demo

    // Create the job
    const newJob = await prisma.job.create({
      data: {
        title: jobData.title,
        description: jobData.description,
        companyName: jobData.companyName,
        location: jobData.location,
        type: jobData.type,
        salaryMin: jobData.salaryMin,
        salaryMax: jobData.salaryMax,
        requirements: jobData.requirements,
        benefits: jobData.benefits,
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
        },
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          }
        }
      }
    })

    // Transform for frontend response
    const transformedJob = {
      id: newJob.id,
      title: newJob.title,
      description: newJob.description,
      companyName: newJob.companyName,
      location: newJob.location,
      type: newJob.type,
      salaryMin: newJob.salaryMin,
      salaryMax: newJob.salaryMax,
      requirements: newJob.requirements,
      benefits: newJob.benefits,
      experience: newJob.experience,
      isRemote: newJob.isRemote,
      applicationDeadline: newJob.applicationDeadline?.toISOString(),
      views: newJob.views,
      applicationsCount: newJob.applicationsCount,
      createdAt: newJob.createdAt.toISOString(),
      author: {
        name: (newJob as any).author?.name || 'Unknown Recruiter',
        username: (newJob as any).author?.username || 'user',
        avatar: (newJob as any).author?.avatar || '',
        title: (newJob as any).author?.title || 'Recruiter'
      }
    }

    return NextResponse.json(transformedJob)
  } catch (error) {
    if (error instanceof z.ZodError) {
    return NextResponse.json([])
    }

    console.error('Error creating job:', error)
    return NextResponse.json([])
  }
}
