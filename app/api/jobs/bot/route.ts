import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-mock'
import { broadcastJobUpdate } from '../websocket/route'
import { EmailService } from '@/lib/email'
import { JobQueueManager } from '@/lib/queue/job-queue-manager'

// Global variables for monitoring
let monitoringInterval: NodeJS.Timeout | null = null
let isMonitoring = false
let connectedClients = 0

// Initialize job queue manager
const jobQueueManager = new JobQueueManager()

// Import WebSocket functions
import { GETStatus as getWebSocketStatus, resetNetworkStats, setMaxClients, getConnectionStats } from '../websocket/route'

// Bot to manage jobs automatically
export async function POST(req: NextRequest) {
  try {
    const { action, jobId, dryRun = false } = await req.json()

    // Handle monitoring actions
    if (action === 'start-monitoring') {
      return await startContinuousMonitoring()
    } else if (action === 'stop-monitoring') {
      return await stopContinuousMonitoring()
    } else if (action === 'monitoring-status') {
      return await getMonitoringStatus()
    }
    
    // Handle network management actions
    else if (action === 'websocket-status') {
      return await getWebSocketStatus()
    } else if (action === 'reset-network-stats') {
      return await resetNetworkStats()
    } else if (action === 'set-max-clients') {
      const { maxClients } = await req.json()
      return await setMaxClients(maxClients)
    } else if (action === 'get-connection-stats') {
      return await getConnectionStats()
    }
    
    // Handle email notification actions
    else if (action === 'send-application-email') {
      const { applicationId } = await req.json()
      return await sendApplicationEmail(applicationId)
    } else if (action === 'send-application-confirmation') {
      const { applicationId } = await req.json()
      return await sendApplicationConfirmationEmail(applicationId)
    } else if (action === 'send-status-update-email') {
      const { applicationId, newStatus } = await req.json()
      return await sendStatusUpdateEmail(applicationId, newStatus)
    }
    
    // Handle job queue/worker actions
    else if (action === 'queue-job') {
      const { jobType, jobData, priority, scheduledFor } = await req.json()
      return await queueJob(jobType, jobData, priority, scheduledFor)
    } else if (action === 'get-queue-stats') {
      return await getQueueStats()
    } else if (action === 'process-queue') {
      return await processQueue()
    } else if (action === 'cleanup-queue') {
      const { daysOld } = await req.json()
      return await cleanupQueue(daysOld)
    } else if (action === 'get-queued-jobs') {
      const { jobType, limit } = await req.json()
      return await getQueuedJobs(jobType, limit)
    }

    // Handle regular bot actions
    switch (action) {
      case 'update-dates':
        return await updateJobDates(dryRun)
      case 'remove-expired':
        return await removeExpiredJobs(dryRun)
      case 'manage-applicants':
        return await manageApplicants(jobId, dryRun)
      case 'full-cleanup':
        return await fullCleanup(dryRun)
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error in job bot:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Update job dates and times
async function updateJobDates(dryRun: boolean) {
  try {
    const now = new Date()
    const jobsToUpdate = await prisma.job.findMany({
      where: {
        isActive: true,
        OR: [
          { applicationDeadline: null },
          { expiresAt: null }
        ]
      }
    })

    let jobsUpdated = 0
    const updates = []

    for (const job of jobsToUpdate) {
      // Set default application deadline (30 days from now)
      const applicationDeadline = job.applicationDeadline || new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

      // Set default expiration date (60 days from now)
      const expiresAt = job.expiresAt || new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

      if (!dryRun) {
        await prisma.job.update({
          where: { id: job.id },
          data: {
            applicationDeadline,
            expiresAt
          }
        })
        jobsUpdated++

        // Broadcast the update
        broadcastJobUpdate({
          type: 'JOB_UPDATED',
          jobId: job.id,
          title: job.title,
          updates: {
            applicationDeadline: applicationDeadline.toISOString(),
            expiresAt: expiresAt.toISOString()
          }
        })
      }

      updates.push({
        jobId: job.id,
        title: job.title,
        applicationDeadline: applicationDeadline.toISOString(),
        expiresAt: expiresAt.toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        jobsUpdated,
        dryRun,
        updates,
        message: dryRun
          ? `Would update dates for ${jobsUpdated} jobs`
          : `Successfully updated dates for ${jobsUpdated} jobs`
      }
    })
  } catch (error) {
    console.error('Error updating job dates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update job dates' },
      { status: 500 }
    )
  }
}

// Remove expired jobs
async function removeExpiredJobs(dryRun: boolean) {
  try {
    const now = new Date()
    const expiredJobs = await prisma.job.findMany({
      where: {
        expiresAt: {
          lt: now
        },
        isActive: true
      },
      include: {
        applications: true
      }
    })

    let jobsRemoved = 0
    let applicationsRemoved = 0
    const removedJobs = []

    for (const job of expiredJobs) {
      if (!dryRun) {
        // Remove all applications for this job
        await prisma.application.deleteMany({
          where: { jobId: job.id }
        })
        applicationsRemoved += job.applications?.length || 0

        // Remove the job
        await prisma.job.delete({
          where: { id: job.id }
        })
        jobsRemoved++

        // Broadcast the removal
        broadcastJobUpdate({
          type: 'JOB_REMOVED',
          jobId: job.id,
          title: job.title,
          reason: 'expired'
        })
      }

      removedJobs.push({
        jobId: job.id,
        title: job.title,
        applicationsCount: job.applications?.length || 0
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        jobsRemoved,
        applicationsRemoved,
        dryRun,
        removedJobs,
        message: dryRun
          ? `Would remove ${jobsRemoved} expired jobs and ${applicationsRemoved} applications`
          : `Successfully removed ${jobsRemoved} expired jobs and ${applicationsRemoved} applications`
      }
    })
  } catch (error) {
    console.error('Error removing expired jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove expired jobs' },
      { status: 500 }
    )
  }
}

// Manage applicants for a specific job
async function manageApplicants(jobId: string, dryRun: boolean) {
  try {
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Job ID is required' },
        { status: 400 }
      )
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          include: {
            user: true
          }
        }
      }
    }) as any

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      )
    }

    // Check if job is expired
    const now = new Date()
    const isExpired = job.expiresAt && job.expiresAt < now

    let applicantsUpdated = 0
    let applicantsRemoved = 0
    const updates = []

    // Ensure job has applications array
    const applications = job.applications || []

    for (const application of applications) {
      if (isExpired) {
        // For expired jobs, remove all applications
        if (!dryRun) {
          await prisma.application.delete({
            where: { id: application.id }
          })
          applicantsRemoved++

          // Broadcast the removal
          broadcastJobUpdate({
            type: 'APPLICATION_REMOVED',
            jobId: job.id,
            applicationId: application.id,
            userId: application.userId
          })
        }

        updates.push({
          applicationId: application.id,
          userId: application.userId,
          userName: application.user?.name || 'Unknown',
          action: 'removed'
        })
      } else {
        // For active jobs, update applicant status based on application deadline
        if (job.applicationDeadline && job.applicationDeadline < now) {
          // Application deadline passed, mark as expired
          if (application.status !== 'EXPIRED' && !dryRun) {
            await prisma.application.update({
              where: { id: application.id },
              data: { status: 'EXPIRED' }
            })
            applicantsUpdated++

            // Broadcast the status update
            broadcastJobUpdate({
              type: 'APPLICATION_STATUS_UPDATED',
              jobId: job.id,
              applicationId: application.id,
              userId: application.userId,
              newStatus: 'EXPIRED'
            })
          }

          updates.push({
            applicationId: application.id,
            userId: application.userId,
            userName: application.user?.name || 'Unknown',
            action: 'marked as expired'
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId,
        jobTitle: job.title,
        isExpired,
        applicantsUpdated,
        applicantsRemoved,
        dryRun,
        updates,
        message: dryRun
          ? `Would update ${applicantsUpdated} applicants and remove ${applicantsRemoved} applicants`
          : `Successfully updated ${applicantsUpdated} applicants and removed ${applicantsRemoved} applicants`
      }
    })
  } catch (error) {
    console.error('Error managing applicants:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to manage applicants' },
      { status: 500 }
    )
  }
}

// Full cleanup: update dates, remove expired jobs, and manage applicants
async function fullCleanup(dryRun: boolean) {
  try {
    // Step 1: Update job dates
    const updateDatesResponse = await updateJobDates(true) // Always dry run for dates
    const updateDatesData = await updateDatesResponse.json()

    // Step 2: Remove expired jobs
    const removeExpiredResponse = await removeExpiredJobs(dryRun)
    const removeExpiredData = await removeExpiredResponse.json()

    // Step 3: Manage applicants for all active jobs
    const activeJobs = await prisma.job.findMany({
      where: { isActive: true },
      select: { id: true }
    })

    let totalApplicantsUpdated = 0
    let totalApplicantsRemoved = 0

    for (const job of activeJobs) {
      const manageResponse = await manageApplicants(job.id, dryRun)
      const manageData = await manageResponse.json()
      
      if (manageData.success) {
        totalApplicantsUpdated += manageData.data.applicantsUpdated
        totalApplicantsRemoved += manageData.data.applicantsRemoved
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        dryRun,
        datesUpdated: updateDatesData.data.jobsUpdated,
        jobsRemoved: removeExpiredData.data.jobsRemoved,
        applicationsRemoved: removeExpiredData.data.applicationsRemoved,
        applicantsUpdated: totalApplicantsUpdated,
        applicantsRemoved: totalApplicantsRemoved,
        message: dryRun
          ? `Full cleanup dry run: Would update ${updateDatesData.data.jobsUpdated} job dates, remove ${removeExpiredData.data.jobsRemoved} jobs, and manage ${totalApplicantsUpdated + totalApplicantsRemoved} applicants`
          : `Full cleanup completed: Updated ${updateDatesData.data.jobsUpdated} job dates, removed ${removeExpiredData.data.jobsRemoved} jobs, and managed ${totalApplicantsUpdated + totalApplicantsRemoved} applicants`
      }
    })
  } catch (error) {
    console.error('Error in full cleanup:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to perform full cleanup' },
      { status: 500 }
    )
  }
}

// Start continuous monitoring (5-second intervals)
async function startContinuousMonitoring() {
  if (isMonitoring) {
    return NextResponse.json({
      success: false,
      error: 'Monitoring is already running'
    })
  }

  isMonitoring = true
  let monitoringCount = 0

  monitoringInterval = setInterval(async () => {
    try {
      monitoringCount++
      const startTime = Date.now()
      
      console.log(`[Monitoring Cycle ${monitoringCount}] Starting at ${new Date().toISOString()}`)

      // Perform lightweight monitoring tasks
      const now = new Date()
      
      // 1. Check for jobs that need date updates (quick check)
      const jobsNeedingDates = await prisma.job.findMany({
        where: {
          isActive: true,
          OR: [
            { applicationDeadline: null },
            { expiresAt: null }
          ]
        },
        select: { id: true, title: true }
      })

      if (jobsNeedingDates.length > 0) {
        console.log(`Found ${jobsNeedingDates.length} jobs needing date updates`)
        broadcastJobUpdate({
          type: 'MONITORING_ALERT',
          alertType: 'JOBS_NEEDING_DATES',
          count: jobsNeedingDates.length,
          timestamp: new Date().toISOString()
        })
      }

      // 2. Check for recently expired jobs (last 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const recentlyExpiredJobs = await prisma.job.findMany({
        where: {
          expiresAt: {
            lt: now,
            gt: fiveMinutesAgo
          },
          isActive: true
        },
        select: { id: true, title: true }
      })

      if (recentlyExpiredJobs.length > 0) {
        console.log(`Found ${recentlyExpiredJobs.length} recently expired jobs`)
        broadcastJobUpdate({
          type: 'MONITORING_ALERT',
          alertType: 'RECENTLY_EXPIRED_JOBS',
          count: recentlyExpiredJobs.length,
          jobs: recentlyExpiredJobs.map(job => ({ id: job.id, title: job.title })),
          timestamp: new Date().toISOString()
        })
      }

      // 3. Check for jobs with approaching deadlines (next 24 hours)
      const twentyFourHoursFromNow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const approachingDeadlineJobs = await prisma.job.findMany({
        where: {
          applicationDeadline: {
            lt: twentyFourHoursFromNow,
            gt: now
          },
          isActive: true
        },
        select: { id: true, title: true, applicationDeadline: true }
      })

      if (approachingDeadlineJobs.length > 0) {
        console.log(`Found ${approachingDeadlineJobs.length} jobs with approaching deadlines`)
        broadcastJobUpdate({
          type: 'MONITORING_ALERT',
          alertType: 'APPROACHING_DEADLINES',
          count: approachingDeadlineJobs.length,
          jobs: approachingDeadlineJobs.map(job => ({
            id: job.id,
            title: job.title,
            deadline: job.applicationDeadline?.toISOString()
          })),
          timestamp: new Date().toISOString()
        })
      }

      // 4. Quick system health check
      const [totalJobs, activeJobs, totalApplications] = await Promise.all([
        prisma.job.count(),
        prisma.job.count({ where: { isActive: true } }),
        prisma.application.count()
      ])

      const monitoringDuration = Date.now() - startTime
      console.log(`[Monitoring Cycle ${monitoringCount}] Completed in ${monitoringDuration}ms`)
      console.log(`  - Total Jobs: ${totalJobs}, Active: ${activeJobs}, Applications: ${totalApplications}`)
      console.log(`  - Connected Clients: ${connectedClients}`)

      // Broadcast system health
      broadcastJobUpdate({
        type: 'SYSTEM_HEALTH',
        data: {
          totalJobs,
          activeJobs,
          totalApplications,
          connectedClients,
          monitoringCycle: monitoringCount,
          cycleDurationMs: monitoringDuration,
          timestamp: new Date().toISOString()
        }
      })

    } catch (error) {
      console.error('Error in monitoring cycle:', error)
      broadcastJobUpdate({
        type: 'MONITORING_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }
  }, 5000) // 5-second interval

  console.log('Continuous monitoring started (5-second intervals)')
  
  return NextResponse.json({
    success: true,
    data: {
      message: 'Continuous monitoring started successfully',
      interval: '5 seconds',
      status: 'running'
    }
  })
}

// Stop continuous monitoring
async function stopContinuousMonitoring() {
  if (!isMonitoring) {
    return NextResponse.json({
      success: false,
      error: 'Monitoring is not running'
    })
  }

  if (monitoringInterval) {
    clearInterval(monitoringInterval)
    monitoringInterval = null
  }

  isMonitoring = false
  console.log('Continuous monitoring stopped')

  return NextResponse.json({
    success: true,
    data: {
      message: 'Continuous monitoring stopped successfully',
      status: 'stopped'
    }
  })
}

// Get monitoring status
async function getMonitoringStatus() {
  return NextResponse.json({
    success: true,
    data: {
      isMonitoring,
      interval: '5 seconds',
      connectedClients,
      lastCycle: isMonitoring ? 'running' : null,
      status: isMonitoring ? 'running' : 'stopped'
    }
  })
}

// Job queue management functions
async function queueJob(jobType: string, jobData: any, priority?: number, scheduledFor?: string) {
  try {
    // Convert scheduledFor string to Date if provided
    const scheduledDate = scheduledFor ? new Date(scheduledFor) : new Date()
    
    // Add job to queue
    const jobId = await jobQueueManager.addJob({
      type: jobType,
      data: JSON.stringify(jobData),
      priority: priority || 0,
      scheduledFor: scheduledDate
    })

    // Broadcast job queued event
    broadcastJobUpdate({
      type: 'JOB_QUEUED',
      jobId,
      jobType,
      priority: priority || 0,
      scheduledFor: scheduledDate.toISOString()
    })

    return NextResponse.json({
      success: true,
      data: {
        message: 'Job added to queue successfully',
        jobId,
        jobType,
        status: 'queued'
      }
    })
  } catch (error) {
    console.error('Error queuing job:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to queue job' },
      { status: 500 }
    )
  }
}

async function getQueueStats() {
  try {
    const stats = await jobQueueManager.getQueueStats()

    return NextResponse.json({
      success: true,
      data: {
        message: 'Queue statistics retrieved successfully',
        stats,
        queueHealth: getQueueHealthStatus(stats)
      }
    })
  } catch (error) {
    console.error('Error getting queue stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get queue stats' },
      { status: 500 }
    )
  }
}

async function processQueue() {
  try {
    // Process a batch of jobs from the queue
    const jobsProcessed = []
    let jobsProcessedCount = 0
    
    // Process up to 5 jobs at a time
    for (let i = 0; i < 5; i++) {
      const job = await jobQueueManager.getNextJob()
      
      if (!job) {
        break // No more jobs in queue
      }

      try {
        // Parse job data
        const jobData = JSON.parse(job.data)
        
        // Handle different job types
        switch (job.type) {
          case 'send_application_email':
            await sendApplicationEmail(jobData.applicationId)
            await jobQueueManager.updateJobStatus(job.id, 'completed', {
              result: 'Email sent successfully'
            })
            break
            
          case 'send_application_confirmation':
            await sendApplicationConfirmationEmail(jobData.applicationId)
            await jobQueueManager.updateJobStatus(job.id, 'completed', {
              result: 'Confirmation email sent successfully'
            })
            break
            
          case 'send_status_update_email':
            await sendStatusUpdateEmail(jobData.applicationId, jobData.newStatus)
            await jobQueueManager.updateJobStatus(job.id, 'completed', {
              result: 'Status update email sent successfully'
            })
            break
            
          case 'update_job_dates':
            await updateJobDates(false) // Actually update dates
            await jobQueueManager.updateJobStatus(job.id, 'completed', {
              result: 'Job dates updated successfully'
            })
            break
            
          case 'remove_expired_jobs':
            await removeExpiredJobs(false) // Actually remove jobs
            await jobQueueManager.updateJobStatus(job.id, 'completed', {
              result: 'Expired jobs removed successfully'
            })
            break
            
          case 'manage_applicants':
            await manageApplicants(jobData.jobId, false) // Actually manage applicants
            await jobQueueManager.updateJobStatus(job.id, 'completed', {
              result: 'Applicants managed successfully'
            })
            break
            
          default:
            console.warn(`Unknown job type: ${job.type}`)
            await jobQueueManager.updateJobStatus(job.id, 'failed', {
              error: `Unknown job type: ${job.type}`
            })
        }

        jobsProcessed.push({
          jobId: job.id,
          type: job.type,
          status: 'completed'
        })
        jobsProcessedCount++
        
        // Broadcast job processed event
        broadcastJobUpdate({
          type: 'JOB_PROCESSED',
          jobId: job.id,
          jobType: job.type,
          status: 'completed'
        })

      } catch (error) {
        console.error(`Error processing job ${job.id}:`, error)
        await jobQueueManager.updateJobStatus(job.id, 'failed', {
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        jobsProcessed.push({
          jobId: job.id,
          type: job.type,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        
        // Broadcast job failed event
        broadcastJobUpdate({
          type: 'JOB_FAILED',
          jobId: job.id,
          jobType: job.type,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Queue processing completed',
        jobsProcessed: jobsProcessedCount,
        jobsFailed: jobsProcessed.filter(j => j.status === 'failed').length,
        details: jobsProcessed
      }
    })
  } catch (error) {
    console.error('Error processing queue:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process queue' },
      { status: 500 }
    )
  }
}

async function cleanupQueue(daysOld: number = 7) {
  try {
    const cleanedUpCount = await jobQueueManager.cleanupOldJobs(daysOld)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Queue cleanup completed',
        cleanedUpCount,
        daysOld
      }
    })
  } catch (error) {
    console.error('Error cleaning up queue:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup queue' },
      { status: 500 }
    )
  }
}

async function getQueuedJobs(jobType?: string, limit: number = 10) {
  try {
    let jobs
    
    if (jobType) {
      jobs = await jobQueueManager.getJobsByType(jobType, limit)
    } else {
      // Get all pending jobs
      const allJobs = await prisma.jobQueue.findMany({
        where: { status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
      
      jobs = allJobs.map(job => ({
        id: job.id,
        type: job.type,
        data: job.data,
        priority: job.priority,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        status: job.status.toLowerCase() as any,
        scheduledFor: job.scheduledFor,
        error: job.error || undefined,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      }))
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Queued jobs retrieved successfully',
        count: jobs.length,
        jobs
      }
    })
  } catch (error) {
    console.error('Error getting queued jobs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get queued jobs' },
      { status: 500 }
    )
  }
}

// Helper function to determine queue health
function getQueueHealthStatus(stats: any) {
  const total = stats.pending + stats.processing
  const capacity = 100 // Max reasonable queue size
  const utilization = (total / capacity) * 100
  
  if (utilization > 90) {
    return 'CRITICAL'
  } else if (utilization > 70) {
    return 'WARNING'
  } else if (stats.failed > stats.pending) {
    return 'DEGRADED'
  } else {
    return 'HEALTHY'
  }
}

// Email notification functions
async function sendApplicationEmail(applicationId: string) {
  try {
    // Get application details
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            author: true // Get employer details
          }
        },
        user: true // Get applicant details
      }
    }) as any

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    const employerEmail = application.job?.employerEmail || application.job?.author?.email
    const applicantName = application.user?.name || 'Applicant'
    const jobTitle = application.job?.title || 'Unknown Position'
    const company = application.job?.companyName || 'Unknown Company'

    if (!employerEmail) {
      return NextResponse.json(
        { success: false, error: 'Employer email not found' },
        { status: 400 }
      )
    }

    // Send email to employer
    await EmailService.sendJobApplicationEmail(
      employerEmail,
      applicantName,
      jobTitle,
      company
    )

    // Also send detailed notification
    await EmailService.sendJobApplicationNotificationEmail(
      employerEmail,
      application.job.author?.name || 'Hiring Manager',
      applicantName,
      jobTitle,
      company,
      application.user.email || 'No email provided'
    )

    return NextResponse.json({
      success: true,
      data: {
        message: 'Application notification email sent successfully',
        applicationId,
        employerEmail,
        applicantName
      }
    })
  } catch (error) {
    console.error('Error sending application email:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send application email' },
      { status: 500 }
    )
  }
}

async function sendApplicationConfirmationEmail(applicationId: string) {
  try {
    // Get application details
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            author: true // Get employer details
          }
        },
        user: true // Get applicant details
      }
    }) as any

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    const applicantEmail = application.user?.email
    const applicantName = application.user?.name || 'Applicant'
    const jobTitle = application.job?.title || 'Unknown Position'
    const company = application.job?.companyName || 'Unknown Company'
    const employerEmail = application.job?.employerEmail || application.job?.author?.email
    const employerPhone = application.job?.employerPhone
    const employerName = application.job?.employerName || application.job?.author?.name

    if (!applicantEmail) {
      return NextResponse.json(
        { success: false, error: 'Applicant email not found' },
        { status: 400 }
      )
    }

    // Send confirmation email to applicant
    await EmailService.sendJobApplicationConfirmationEmail(
      applicantEmail,
      applicantName,
      jobTitle,
      company,
      employerEmail,
      employerPhone,
      employerName
    )

    return NextResponse.json({
      success: true,
      data: {
        message: 'Application confirmation email sent successfully',
        applicationId,
        applicantEmail,
        applicantName
      }
    })
  } catch (error) {
    console.error('Error sending application confirmation email:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send application confirmation email' },
      { status: 500 }
    )
  }
}

async function sendStatusUpdateEmail(applicationId: string, newStatus: string) {
  try {
    // Get application details
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            author: true // Get employer details
          }
        },
        user: true // Get applicant details
      }
    }) as any

    if (!application) {
      return NextResponse.json(
        { success: false, error: 'Application not found' },
        { status: 404 }
      )
    }

    const applicantEmail = application.user?.email
    const applicantName = application.user?.name || 'Applicant'
    const jobTitle = application.job?.title || 'Unknown Position'
    const company = application.job?.companyName || 'Unknown Company'

    if (!applicantEmail) {
      return NextResponse.json(
        { success: false, error: 'Applicant email not found' },
        { status: 400 }
      )
    }

    // Determine email content based on status
    let subject, message, actionUrl, actionText
    
    switch (newStatus) {
      case 'REVIEWED':
        subject = `Your Application for ${jobTitle} is Under Review`
        message = `Dear ${applicantName},<br><br>Your application for the position of ${jobTitle} at ${company} has been reviewed by our hiring team. We appreciate your interest in joining our team.<br><br>We will get back to you shortly with an update on your application status. In the meantime, feel free to explore other opportunities on our platform.<br><br>Best regards,<br>The ${company} Team`
        actionUrl = '/applications'
        actionText = 'View My Applications'
        break
      
      case 'ACCEPTED':
        subject = `Congratulations! Your Application for ${jobTitle} has been Accepted`
        message = `Dear ${applicantName},<br><br>We're excited to inform you that your application for the position of ${jobTitle} at ${company} has been accepted! Our hiring team was impressed with your qualifications and experience.<br><br>A member of our team will contact you shortly to discuss the next steps in our hiring process.<br><br>Congratulations and welcome to the next stage!<br><br>Best regards,<br>The ${company} Team`
        actionUrl = '/applications'
        actionText = 'View Application Status'
        break
      
      case 'REJECTED':
        subject = `Update on Your Application for ${jobTitle}`
        message = `Dear ${applicantName},<br><br>Thank you for your interest in the ${jobTitle} position at ${company}. After careful consideration, we've decided to move forward with other candidates whose qualifications more closely match our current needs.<br><br>We appreciate the time and effort you put into your application and encourage you to apply for future opportunities that align with your skills and experience.<br><br>Best regards,<br>The ${company} Team`
        actionUrl = '/jobs'
        actionText = 'Explore Other Opportunities'
        break
      
      case 'EXPIRED':
        subject = `Application Update for ${jobTitle}`
        message = `Dear ${applicantName},<br><br>We wanted to inform you that the application period for the ${jobTitle} position at ${company} has ended. Your application is now marked as expired in our system.<br><br>Thank you for your interest in this opportunity. We encourage you to continue exploring other positions that may be a good fit for your skills and experience.<br><br>Best regards,<br>The ${company} Team`
        actionUrl = '/jobs'
        actionText = 'Browse Current Job Openings'
        break
      
      default:
        subject = `Your Application Status for ${jobTitle} has Changed`
        message = `Dear ${applicantName},<br><br>The status of your application for the ${jobTitle} position at ${company} has been updated to: <strong>${newStatus}</strong>.<br><br>You can view the updated status and any additional details in your applications dashboard.<br><br>Best regards,<br>The ${company} Team`
        actionUrl = '/applications'
        actionText = 'View Application Status'
    }

    // Send status update email
    await EmailService.sendNotificationEmail(
      applicantEmail,
      subject,
      message,
      actionUrl,
      actionText
    )

    return NextResponse.json({
      success: true,
      data: {
        message: 'Status update email sent successfully',
        applicationId,
        applicantEmail,
        applicantName,
        newStatus
      }
    })
  } catch (error) {
    console.error('Error sending status update email:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send status update email' },
      { status: 500 }
    )
  }
}

// GET endpoint to get bot status
export async function GET() {
  try {
    const now = new Date()
    
    // Get statistics
    const [
      totalJobs,
      activeJobs,
      expiredJobs,
      jobsMissingDates,
      totalApplications
    ] = await Promise.all([
      prisma.job.count(),
      prisma.job.count({ where: { isActive: true } }),
      prisma.job.count({ 
        where: { 
          expiresAt: { lt: now }, 
          isActive: true 
        } 
      }),
      prisma.job.count({ 
        where: { 
          OR: [
            { applicationDeadline: null },
            { expiresAt: null }
          ]
        } 
      }),
      prisma.application.count()
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalJobs,
        activeJobs,
        inactiveJobs: totalJobs - activeJobs,
        expiredJobs,
        jobsMissingDates,
        totalApplications,
        lastCleanup: null, // Could be stored in a separate table
        botStatus: 'ready',
        monitoringStatus: isMonitoring ? 'running' : 'stopped',
        monitoringInterval: isMonitoring ? '5 seconds' : null
      }
    })
  } catch (error) {
    console.error('Error fetching bot status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bot status' },
      { status: 500 }
    )
  }
}