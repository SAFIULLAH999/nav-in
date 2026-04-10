import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check database connectivity
    const jobCount = await prisma.job.count();

    return NextResponse.json({
      success: true,
      data: {
        message: 'Jobs API is healthy',
        jobsInDatabase: jobCount,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        data: {
          message: 'Jobs API has issues - check server logs'
        }
      },
      { status: 500 }
    )
  }
}
