import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { JWTManager } from '@/lib/jwt'
import { Logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

// GET - Get system reports and analytics
export async function GET(request: NextRequest) {
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

    // Get comprehensive system reports
    const [
      totalUsers,
      activeUsers,
      totalJobs,
      activeJobs,
      totalApplications,
      totalMessages,
      newUsersToday,
      newJobsToday,
      systemHealth
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Active users (logged in within last 30 days)
      prisma.user.count({
        where: {
          lastLoginAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Total jobs
      prisma.job.count(),

      // Active jobs
      prisma.job.count({
        where: { isActive: true }
      }),

      // Total applications
      prisma.application.count(),

      // Total messages
      prisma.message.count(),

      // New users today
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),

      // New jobs today
      prisma.job.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),

      // System health check
      checkSystemHealth()
    ])

    const reports = {
      totalUsers,
      activeUsers,
      totalJobs,
      activeJobs,
      totalApplications,
      totalMessages,
      newUsersToday,
      newJobsToday,
      systemHealth,
      generatedAt: new Date().toISOString()
    }

    Logger.info('Admin reports accessed', {
      adminId: payload.userId,
      reportType: 'system_overview'
    })

    return NextResponse.json({
      success: true,
      data: reports
    })
  } catch (error) {
    Logger.error('Admin reports error', error as Error, {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      { success: false, error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

// System health check function
async function checkSystemHealth(): Promise<'good' | 'warning' | 'critical'> {
  try {
    // Check database connectivity
    await prisma.$queryRaw`SELECT 1`

    // Check recent error rates
    const recentErrors = await prisma.backupLog.count({
      where: {
        status: 'FAILED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })

    // Check system performance (you could add more sophisticated checks)
    const memoryUsage = process.memoryUsage()
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100

    // Determine health status
    if (recentErrors > 5 || memoryUsagePercent > 90) {
      return 'critical'
    } else if (recentErrors > 2 || memoryUsagePercent > 75) {
      return 'warning'
    } else {
      return 'good'
    }
  } catch (error) {
    Logger.error('System health check failed', error as Error)
    return 'critical'
  }
}
