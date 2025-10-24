import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST - Load more jobs from external sources
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchQuery, location, limit, page } = body

    // For demo purposes, generate mock jobs
    // In a real implementation, this would scrape from Indeed, LinkedIn, etc.
    const mockJobs = generateMockJobs(
      searchQuery || 'software engineer',
      location || 'remote',
      limit || 20,
      page || 1
    )

    return NextResponse.json({
      success: true,
      data: mockJobs,
      meta: {
        hasMore: true,
        page: page || 1,
        total: mockJobs.length
      }
    })
  } catch (error) {
    console.error('Error loading more jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load more jobs' },
      { status: 500 }
    )
  }
}

function generateMockJobs(searchQuery: string, location: string, limit: number, page: number) {
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

  for (let i = 0; i < limit; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)]
    const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)]
    const jobLocation = location !== 'remote' ? location : locations[Math.floor(Math.random() * locations.length)]

    const salaryMin = Math.floor(Math.random() * 50000) + 50000
    const salaryMax = salaryMin + Math.floor(Math.random() * 50000) + 20000

    jobs.push({
      id: `mock-${Date.now()}-${page}-${i}`,
      title: `${searchQuery} ${['Developer', 'Engineer', 'Manager', 'Specialist', 'Analyst'][Math.floor(Math.random() * 5)]}`,
      description: `We are looking for a talented ${searchQuery} to join our growing team. You will work on exciting projects and collaborate with a dynamic team of professionals.`,
      company: company,
      companyName: company,
      location: jobLocation,
      type: jobType,
      salaryMin,
      salaryMax,
      requirements: [
        'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
        'AWS', 'Docker', 'Kubernetes', 'SQL', 'NoSQL'
      ].sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 5) + 3),
      benefits: 'Health insurance, 401k, remote work options, professional development',
      experience: ['JUNIOR', 'MID', 'SENIOR'][Math.floor(Math.random() * 3)],
      isRemote: jobLocation === 'Remote' || Math.random() > 0.5,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      views: Math.floor(Math.random() * 1000),
      applicationsCount: Math.floor(Math.random() * 50),
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      author: {
        name: 'Hiring Manager',
        username: 'hiring-manager',
        avatar: '',
        title: 'HR Manager'
      }
    })
  }

  return jobs
}
