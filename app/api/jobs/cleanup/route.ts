import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-mock'
import https from 'https'
import http from 'http'

export async function POST(req: NextRequest) {
  try {
    const { dryRun = false } = await req.json()

    let jobsRemoved = 0
    let jobsExpired = 0
    let jobsInvalid = 0

    // 1. Remove expired jobs (based on expiresAt field)
    const expiredJobs = await prisma.job.findMany({
      where: {
        expiresAt: {
          lt: new Date()
        },
        isActive: true
      }
    })

    if (expiredJobs.length > 0) {
      if (!dryRun) {
        await prisma.job.deleteMany({
          where: {
            id: {
              in: expiredJobs.map(job => job.id)
            }
          }
        })
        console.log(`Deleted ${expiredJobs.length} expired jobs`)
      }
      jobsExpired = expiredJobs.length
    }

    // 2. Check scraped jobs for validity (Page not found, etc.)
    const scrapedJobs = await prisma.job.findMany({
      where: {
        isScraped: true,
        isActive: true,
        validityStatus: 'VALID',
        OR: [
          { lastValidated: null },
          { lastValidated: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // Not validated in last 7 days
        ]
      },
      take: 50 // Limit to avoid overwhelming external APIs
    })

    for (const job of scrapedJobs) {
      try {
        // For scraped jobs, we need to check if the original URL is still valid
        // This is a simplified check - in a real implementation, you'd check the actual job posting URL
        const isValid = await checkJobValidity(job)

        if (!isValid) {
          if (!dryRun) {
            await prisma.job.update({
              where: { id: job.id },
              data: {
                isActive: false,
                validityStatus: 'NOT_FOUND',
                lastValidated: new Date()
              }
            })
          }
          jobsInvalid++
        } else {
          // Update last validated timestamp
          if (!dryRun) {
            await prisma.job.update({
              where: { id: job.id },
              data: {
                lastValidated: new Date()
              }
            })
          }
        }

        // Small delay to avoid overwhelming servers
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.error(`Error validating job ${job.id}:`, error)
        // Mark as invalid if we can't check it
        if (!dryRun) {
          await prisma.job.update({
            where: { id: job.id },
            data: {
              isActive: false,
              validityStatus: 'INVALID_URL',
              lastValidated: new Date()
            }
          })
        }
        jobsInvalid++
      }
    }

    jobsRemoved = jobsExpired + jobsInvalid

    return NextResponse.json({
      success: true,
      data: {
        jobsRemoved,
        jobsExpired,
        jobsInvalid,
        dryRun,
        message: dryRun
          ? `Would remove ${jobsRemoved} jobs (${jobsExpired} expired, ${jobsInvalid} invalid)`
          : `Successfully removed ${jobsRemoved} jobs (${jobsExpired} expired, ${jobsInvalid} invalid)`
      }
    })
  } catch (error) {
    console.error('Error cleaning up jobs:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to check if a job is still valid
async function checkJobValidity(job: any): Promise<boolean> {
  // For scraped jobs, we can check if the source is still active
  // This is a simplified implementation - in production, you'd check the actual job posting URL

  if (job.sourceId) {
    // Check if the job source is still active
    const source = await prisma.jobSource.findUnique({
      where: { id: job.sourceId }
    })

    if (!source || !source.isActive) {
      return false
    }
  }

  // For jobs with application deadlines, check if they've passed
  if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
    return false
  }

  // For jobs older than 90 days, consider them potentially expired
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  if (job.createdAt < ninetyDaysAgo) {
    // For very old jobs, we might want to mark them as expired
    // unless they've had recent activity
    if (!job.lastValidated || job.lastValidated < ninetyDaysAgo) {
      return false
    }
  }

  // If we can't determine validity through other means, assume valid
  return true
}

// GET endpoint to get cleanup statistics
export async function GET() {
  try {
    const [
      totalJobs,
      activeJobs,
      expiredJobs,
      invalidJobs,
      recentlyValidated
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { isActive: true } }),
      prisma.job.count({ where: { validityStatus: 'EXPIRED' } }),
      prisma.job.count({ where: { validityStatus: { in: ['NOT_FOUND', 'INVALID_URL'] } } }),
      prisma.job.count({
        where: {
          lastValidated: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalJobs,
        activeJobs,
        inactiveJobs: totalJobs - activeJobs,
        expiredJobs,
        invalidJobs,
        recentlyValidated,
        lastCleanup: null // Could be stored in a separate table
      }
    })
  } catch (error) {
    console.error('Error fetching cleanup statistics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
