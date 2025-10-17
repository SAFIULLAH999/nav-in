import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { JWTManager } from '@/lib/jwt'
import { validateData, jobCreateSchema, jobSearchSchema, JobCreateInput, JobSearchInput } from '@/lib/validations'

// GET - Search and list jobs with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract search parameters
    const query = searchParams.get('query') || undefined
    const location = searchParams.get('location') || undefined
    const type = searchParams.get('type') as any || undefined
    const company = searchParams.get('company') || undefined
    const salaryMin = searchParams.get('salaryMin') ? parseInt(searchParams.get('salaryMin')!) : undefined
    const salaryMax = searchParams.get('salaryMax') ? parseInt(searchParams.get('salaryMax')!) : undefined
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

    // Build where clause for filtering
    const where: any = {
      isActive: true
    }

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { company: { contains: query, mode: 'insensitive' } },
        { requirements: { hasSome: [query] } }
      ]
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' }
    }

    if (type) {
      where.type = type
    }

    if (company) {
      where.company = { contains: company, mode: 'insensitive' }
    }

    if (salaryMin !== undefined || salaryMax !== undefined) {
      where[salaryMin !== undefined && salaryMax !== undefined ? 'AND' : 'OR'] = [
        ...(salaryMin !== undefined ? [{ salaryMin: { gte: salaryMin } }] : []),
        ...(salaryMax !== undefined ? [{ salaryMax: { lte: salaryMax } }] : [])
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Get jobs with pagination
    const [jobs, totalCount] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              avatar: true,
              company: true
            }
          },
          _count: {
            select: {
              applications: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.job.count({ where })
    ])

    // Format response
    const formattedJobs = jobs.map(job => ({
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
      isActive: job.isActive,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      author: job.author,
      applicationCount: job._count.applications
    }))

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      success: true,
      data: {
        jobs: formattedJobs,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    })
  } catch (error) {
    console.error('Jobs search error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search jobs' },
      { status: 500 }
    )
  }
}

// POST - Create a new job posting
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = JWTManager.verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validation = validateData(jobCreateSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validation.errors.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
        },
        { status: 400 }
      )
    }

    const jobData: JobCreateInput = validation.data

    // Create job posting
    const job = await prisma.job.create({
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
        authorId: payload.userId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            company: true
          }
        }
      }
    })

    const formattedJob = {
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
      isActive: job.isActive,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      author: job.author,
      applicationCount: 0
    }

    return NextResponse.json({
      success: true,
      data: formattedJob,
      message: 'Job posted successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Job creation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create job' },
      { status: 500 }
    )
  }
}
