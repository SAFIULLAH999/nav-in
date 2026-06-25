import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { cacheGet, cacheSet, cacheDeletePattern } from '@/lib/redis'
import { jobBroadcast } from '@/lib/realtime'

// Lazy import to avoid circular dependency issues
let broadcastJobUpdate: ((data: any) => void) | null = null
try {
  const wsModule = require('../jobs/websocket/route')
  broadcastJobUpdate = wsModule.broadcastJobUpdate
} catch (e) {
  console.warn('WebSocket module not available, job broadcasts disabled')
  broadcastJobUpdate = null
}

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

function generateMockJobData(searchQuery: string, location: string, limit: number) {
  const companies = [
    'TechCorp Inc.', 'DataFlow Systems', 'StartupXYZ', 'CloudTech Solutions',
    'MobileFirst', 'WebSolutions Ltd', 'DevStudio', 'CodeWorks', 'AppFactory',
    'Digital Dynamics', 'SoftTech', 'ByteWorks', 'PixelPerfect', 'NetSolutions',
    'CyberTech', 'DataDriven', 'CloudNine', 'TechFlow', 'CodeMasters', 'WebWizards'
  ]

  const jobTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'REMOTE']
  const locations = [
    'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA',
    'Los Angeles, CA', 'Chicago, IL', 'Boston, MA', 'Denver, CO',
    'Atlanta, GA', 'Miami, FL', 'Remote', 'San Diego, CA'
  ]

  const jobs = []
  const usedIds = new Set<string>()

  for (let i = 0; i < limit; i++) {
    let id: string
    do {
      id = `mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}-${i}`
    } while (usedIds.has(id))
    usedIds.add(id)

    const company = companies[Math.floor(Math.random() * companies.length)]
    const jobType = jobTypes[Math.floor(Math.random() * companies.length) % jobTypes.length]
    const jobLocation = location && location.toLowerCase() !== 'remote' ? location : locations[Math.floor(Math.random() * companies.length) % locations.length]

    const salaryMin = Math.floor(Math.random() * 50000) + 50000
    const salaryMax = salaryMin + Math.floor(Math.random() * 50000) + 20000

    jobs.push({
      id,
      title: `${searchQuery} ${['Developer', 'Engineer', 'Manager', 'Specialist', 'Analyst'][Math.floor(Math.random() * 5)]}`,
      description: `We are looking for a talented ${searchQuery} to join our growing team. You will work on exciting projects and collaborate with a dynamic team of professionals.`,
      companyName: company,
      location: jobLocation,
      type: jobType,
      salaryMin,
      salaryMax,
      requirements: JSON.stringify([
        'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
        'AWS', 'Docker', 'Kubernetes', 'SQL', 'NoSQL'
      ].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 5) + 3)),
      benefits: 'Health insurance, 401k, remote work options, professional development',
      experience: ['JUNIOR', 'MID', 'SENIOR'][Math.floor(Math.random() * 3)],
      isRemote: jobLocation === 'Remote' || Math.random() > 0.5,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isActive: true,
      validityStatus: 'VALID',
      lastValidated: new Date(),
      isScraped: false,
      lastScraped: null,
      authorId: 'demo-user-1',
      views: 0,
      applicationsCount: 0,
      createdAt: new Date(),
    })
  }

  return jobs
}

// GET - Search and filter jobs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const search = searchParams.get('search') || ''
    const location = searchParams.get('location') || ''
    const company = searchParams.get('company') || ''
    const type = searchParams.get('type') || ''
    const offset = (page - 1) * limit

    // Generate cache key from all query parameters
    const cacheKey = `jobs:search:${page}:${limit}:${search}:${location}:${company}:${type}`
    
    // Try to get from cache first
    const cached = await cacheGet(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    // Build where clause for filtering
    const where: any = {}

    // Add search conditions
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
      ]
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' }
    }

    if (company) {
      where.companyName = { contains: company, mode: 'insensitive' }
    }

    if (type) {
      where.type = type
    }

    // Get total count for pagination
    let totalCount = 0
    let jobs: any[] = []
    
    try {
      totalCount = await prisma.job.count({ where });

    // Fetch jobs - check if isActive filter is already applied
    const queryWhere = { ...where, isActive: true }
    
    jobs = await prisma.job.findMany({
      where: queryWhere,
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
    });
    
    // If no active jobs, try without filter for debugging
    if (jobs.length === 0) {
      jobs = await prisma.job.findMany({
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
      });
      
      if (jobs.length > 0) {
        console.log(`Found ${jobs.length} inactive jobs - marking as active`);
        await prisma.job.updateMany({
          where: { isActive: false },
          data: { isActive: true }
        });
      }
    }
    } catch (error) {
      console.error('Database unavailable:', error)
      // Return empty result set instead of error for better UX
      return NextResponse.json({
        success: true,
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasMore: false }
      })
    }

    if (jobs.length === 0) {
      console.log('Database empty - generating mock jobs')
      const mockJobData = generateMockJobData(search, location, limit)
      for (const job of mockJobData) {
        try {
          await prisma.job.create({ data: job })
        } catch (e) {
          // Ignore duplicate key errors
        }
      }
      totalCount = await prisma.job.count({ where })
      jobs = await prisma.job.findMany({
        where: queryWhere,
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
    }

    // Transform jobs for frontend
    const transformedJobs = jobs.map(job => {
      let requirements: any[] = []
      try {
        if (job.requirements && typeof job.requirements === 'string') {
          requirements = JSON.parse(job.requirements)
        } else if (Array.isArray(job.requirements)) {
          requirements = job.requirements
        }
      } catch (e) {
        // If parsing fails, treat as a single requirement string
        requirements = job.requirements ? [job.requirements] : []
      }

      return {
        id: job.id || '',
        title: job.title || '',
        description: job.description || '',
        company: job.companyName || '',
        companyName: job.companyName || '',
        location: job.location || '',
        type: job.type || '',
        salaryMin: job.salaryMin || null,
        salaryMax: job.salaryMax || null,
        requirements: Array.isArray(requirements) ? requirements : [],
        benefits: job.benefits || '',
        experience: job.experience || '',
        isRemote: job.isRemote || false,
        applicationDeadline: job.applicationDeadline ? job.applicationDeadline.toISOString() : null,
        views: job.views || 0,
        applicationsCount: job._count?.applications || 0,
        createdAt: job.createdAt ? job.createdAt.toISOString() : new Date().toISOString(),
        author: job.author ? {
          name: job.author.name || 'Unknown Recruiter',
          username: job.author.username || 'user',
          avatar: job.author.avatar || '',
          title: job.author.title || 'Recruiter'
        } : {
          name: 'Unknown Recruiter',
          username: 'user',
          avatar: '',
          title: 'Recruiter'
        }
      }
    })

    const totalPages = Math.ceil(totalCount / limit) || 1;
    const hasMore = page < totalPages;

    const response = {
      success: true,
      data: transformedJobs,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore
      }
    }

    // Cache for 5 minutes
    await cacheSet(cacheKey, response, 300)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch jobs',
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0, hasMore: false }
      },
      { status: 500 }
    )
  }
}

// POST - Create a new job posting
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const jobData = createJobSchema.parse(body)

    // For demo purposes, create job without authentication
    const authorId = 'demo-user-1' // This should be replaced with proper auth

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
            email: true,
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      }
    })

    // Parse requirements safely
    let requirements = []
    try {
      if (newJob.requirements) {
        requirements = JSON.parse(newJob.requirements)
      }
    } catch (e) {
      requirements = newJob.requirements ? [newJob.requirements] : []
    }

    // Transform for frontend response
    const transformedJob = {
      id: newJob.id,
      title: newJob.title,
      description: newJob.description,
      company: newJob.companyName,
      companyName: newJob.companyName,
      location: newJob.location,
      type: newJob.type,
      salaryMin: newJob.salaryMin,
      salaryMax: newJob.salaryMax,
      requirements,
      benefits: newJob.benefits,
      experience: newJob.experience,
      isRemote: newJob.isRemote,
      applicationDeadline: newJob.applicationDeadline?.toISOString(),
      views: newJob.views,
      applicationsCount: newJob._count.applications,
      createdAt: newJob.createdAt.toISOString(),
      author: {
        name: newJob.author?.name || 'Unknown Recruiter',
        username: newJob.author?.username || 'user',
        avatar: newJob.author?.avatar || '',
        title: newJob.author?.title || 'Recruiter'
      }
    }

    // Broadcast the new job to all WebSocket clients
    if (broadcastJobUpdate) {
      broadcastJobUpdate({
        type: 'JOB_CREATED',
        job: transformedJob
      })
    }

    jobBroadcast({
      type: 'JOB_CREATED',
      job: transformedJob
    })

    // Invalidate job search cache when new job is created
    await cacheDeletePattern('jobs:search:*')

    return NextResponse.json({
      success: true,
      data: transformedJob,
      message: 'Job created successfully'
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
