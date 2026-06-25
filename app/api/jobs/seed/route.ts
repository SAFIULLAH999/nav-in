import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { count = 20, searchQuery = 'software engineer', location = 'remote' } = body

    const existingCount = await prisma.job.count()
    if (existingCount > 0) {
      return NextResponse.json({
        success: true,
        message: `Database already has ${existingCount} jobs. Skipping seed.`,
        jobsCreated: 0,
      })
    }

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

    const jobsCreated = []

    for (let i = 0; i < count; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)]
      const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)]
      const jobLocation = location !== 'remote' ? location : locations[Math.floor(Math.random() * locations.length)]

      const salaryMin = Math.floor(Math.random() * 50000) + 50000
      const salaryMax = salaryMin + Math.floor(Math.random() * 50000) + 20000

      const job = await prisma.job.create({
        data: {
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
          isActive: true,
          validityStatus: 'VALID',
          lastValidated: new Date(),
          isScraped: false,
          authorId: 'system',
          views: Math.floor(Math.random() * 1000),
          applicationsCount: Math.floor(Math.random() * 50),
        }
      })

      jobsCreated.push(job)
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${jobsCreated.length} jobs`,
      jobsCreated: jobsCreated.length,
    })
  } catch (error) {
    console.error('Error seeding jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to seed jobs' },
      { status: 500 }
    )
  }
}