import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const job = await prisma.job.findUnique({
      where: { id: params.id },
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
        author: {
          select: {
            name: true,
            username: true,
            avatar: true,
            title: true,
            email: true,
          }
        }
      },
    })

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    const transformedJob = {
      id: job.id,
      title: job.title,
      description: job.description,
      company: job.companyName,
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
      author: job.author ? {
        name: job.author.name,
        username: job.author.username,
        avatar: job.author.avatar || '',
        title: job.author.title,
        email: job.author.email,
      } : null,
    }

    return NextResponse.json({
      success: true,
      data: transformedJob,
    })
  } catch (error) {
    console.error('Error fetching job details:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch job details' },
      { status: 500 }
    )
  }
}