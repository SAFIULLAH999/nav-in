export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get('search') || ''
    const location = request.nextUrl.searchParams.get('location') || ''
    const page = Number(request.nextUrl.searchParams.get('page') || '1')
    const limit = Number(request.nextUrl.searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const data = buildDemoJobs(search || 'software engineer', location || 'remote', limit)

    return NextResponse.json({
      ok: true,
      data,
      page,
      limit,
      total: data.length,
      hasMore: false,
    })
  } catch (error) {
    console.error('jobs route failed:', error)
    return NextResponse.json({
      ok: true,
      data: [],
      page: 1,
      limit: 20,
      total: 0,
      hasMore: false,
    })
  }
}

type DemoJob = {
  id: string
  title: string
  description: string
  companyName: string
  location: string
  type: string
  salaryMin: number | null
  salaryMax: number | null
  requirements: string[]
  benefits?: string
  experience?: string
  isRemote?: boolean
  applicationDeadline?: string | null
  views?: number
  applicationsCount?: number
  createdAt: string
  author: {
    name: string
    username: string
    avatar: string
    title: string
  }
}

function buildDemoJobs(searchQuery: string, location: string, count: number): DemoJob[] {
  const companies = [
    'TechCorp Inc.',
    'DataFlow Systems',
    'StartupXYZ',
    'CloudTech Solutions',
    'MobileFirst',
    'WebSolutions Ltd',
    'DevStudio',
    'CodeWorks',
    'AppFactory',
    'Digital Dynamics',
    'SoftTech',
    'ByteWorks',
    'PixelPerfect',
    'NetSolutions',
  ]

  const jobTypes = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'REMOTE']
  const locations = [
    'San Francisco, CA',
    'New York, NY',
    'Austin, TX',
    'Seattle, WA',
    'Los Angeles, CA',
    'Chicago, IL',
    'Boston, MA',
    'Denver, CO',
    'Remote',
    'San Diego, CA',
  ]

  return Array.from({ length: count }, (_, i) => {
    const company = companies[i % companies.length]
    const jobType = jobTypes[i % jobTypes.length]
    const jobLocation = location !== 'remote' ? location : locations[i % locations.length]
    const salaryMin = 50000 + (i % 5) * 10000
    const salaryMax = salaryMin + 20000 + (i % 3) * 10000

    const username = company.toLowerCase().replace(/[^a-z0-9]+/g, '-')

    return {
      id: `demo-${searchQuery}-${i}`,
      title: `${searchQuery} ${['Developer', 'Engineer', 'Manager', 'Specialist', 'Analyst'][i % 5]}`,
      description: `We are looking for a talented ${searchQuery} to join our growing team. You will work on exciting projects.`,
      companyName: company,
      location: jobLocation,
      type: jobType,
      salaryMin,
      salaryMax,
      requirements: ['JavaScript', 'TypeScript', 'React', "Node.js", 'Python'],
      benefits: 'Health insurance, 401k, remote work options',
      experience: ['JUNIOR', 'MID', 'SENIOR'][i % 3],
      isRemote: jobLocation === 'Remote' || i % 2 === 0,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      views: 100 + (i % 10) * 50,
      applicationsCount: i % 20,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      author: {
        name: company,
        username,
        avatar: '',
        title: 'Hiring Manager',
      },
    }
  })
}