import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchQuery = 'software engineer', location = 'remote', limit = 20, page = 1 } = body

    const skip = (page - 1) * limit

    // Query valid jobs from DB
    const where: any = {
      isActive: true,
      validityStatus: 'VALID',
    }

    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { companyName: { contains: searchQuery, mode: 'insensitive' } },
      ]
    }

    if (location && location !== 'remote') {
      where.location = { contains: location, mode: 'insensitive' }
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          companyName: true,
          location: true,
          type: true,
          salaryMin: true,
          salaryMax: true,
          requirements: true,
          benefits: true,
          experience: true,
          isRemote: true,
          applicationDeadline: true,
          sourceUrl: true,
          source: true,
          isScraped: true,
          views: true,
          applicationsCount: true,
          createdAt: true,
        }
      }),
      prisma.job.count({ where })
    ])

    // If no jobs yet, seed demo jobs for UI
    if (jobs.length === 0 && page === 1) {
      const existing = await prisma.job.count()
      if (existing === 0) {
        await prisma.job.createMany({
          data: generateDemoJobs(searchQuery, location, limit),
        })
      }

      const [seededJobs, seededTotal] = await Promise.all([
        prisma.job.findMany({
          where,
          take: limit,
          skip,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            description: true,
            companyName: true,
            location: true,
            type: true,
            salaryMin: true,
            salaryMax: true,
            requirements: true,
            benefits: true,
            experience: true,
            isRemote: true,
            applicationDeadline: true,
            sourceUrl: true,
            source: true,
            isScraped: true,
            views: true,
            applicationsCount: true,
            createdAt: true,
          }
        }),
        prisma.job.count({ where })
      ])

      const transformed = seededJobs.map((job: any) => ({
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
        sourceUrl: job.sourceUrl,
        source: job.source,
        isScraped: job.isScraped,
        views: job.views,
        applicationsCount: job.applicationsCount,
        createdAt: job.createdAt.toISOString(),
        author: {
          name: job.companyName,
          username: job.companyName?.toLowerCase().replace(/\s+/g, '-'),
          avatar: '',
          title: 'Hiring Manager'
        }
      }))

      return NextResponse.json({
        success: true,
        data: transformed,
        meta: {
          hasMore: seededTotal > limit,
          page: 1,
          total: seededTotal,
          limit,
        }
      })
    }

    const transformedJobs = jobs.map((job: any) => ({
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
      sourceUrl: job.sourceUrl,
      source: job.source,
      isScraped: job.isScraped,
      views: job.views,
      applicationsCount: job.applicationsCount,
      createdAt: job.createdAt.toISOString(),
      author: {
        name: job.companyName,
        username: job.companyName?.toLowerCase().replace(/\s+/g, '-'),
        avatar: '',
        title: 'Hiring Manager'
      }
    }))

    return NextResponse.json({
      success: true,
      data: transformedJobs,
      meta: {
        hasMore: total > skip + jobs.length,
        page,
        total,
        limit
      }
    })
  } catch (error) {
    console.error('Error searching jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search jobs' },
      { status: 500 }
    )
  }
}

function generateDemoJobs(searchQuery: string, location: string, count: number) {
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

  return Array.from({ length: count }, (_, i) => {
    const company = companies[i % companies.length]
    const jobType = jobTypes[i % jobTypes.length]
    const jobLocation = location !== 'remote' ? location : locations[i % locations.length]
    const salaryMin = 50000 + (i % 5) * 10000
    const salaryMax = salaryMin + 20000 + (i % 3) * 10000

    return {
      title: `${searchQuery} ${['Developer', 'Engineer', 'Manager', 'Specialist', 'Analyst'][i % 5]}`,
      description: `We are looking for a talented ${searchQuery} to join our growing team. You will work on exciting projects and collaborate with a dynamic team of professionals.`,
      companyName: company,
      location: jobLocation,
      type: jobType,
      salaryMin,
      salaryMax,
      requirements: JSON.stringify([
        'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
        'AWS', 'Docker', 'Kubernetes', 'SQL', 'NoSQL'
      ].slice(0, 3 + (i % 5))),
      benefits: 'Health insurance, 401k, remote work options, professional development',
      experience: ['JUNIOR', 'MID', 'SENIOR'][i % 3],
      isRemote: jobLocation === 'Remote' || i % 2 === 0,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      validityStatus: 'VALID',
      lastValidated: new Date().toISOString(),
      isScraped: false,
      authorId: 'system',
      views: 100 + (i % 10) * 50,
      applicationsCount: i % 20,
    }
  })
}