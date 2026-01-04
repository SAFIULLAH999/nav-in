import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-mock'
import { broadcastJobUpdate } from '../websocket/route'
import { EmailService } from '@/lib/email'
import { JobQueueManager } from '@/lib/queue/job-queue-manager'

// Global variables for monitoring
let monitoringInterval: NodeJS.Timeout | null = null
let isMonitoring = false
let connectedClients = 0
let autoStartAttempted = false

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
      const now = new Date()
      
      console.log(`[🚀 ULTRA-FAST Monitoring Cycle ${monitoringCount}] Starting at ${new Date().toISOString()}`)
  
      // 1. INSTANT EXPIRED JOB CLEANUP - Check every second
      const expiredJobs = await prisma.job.findMany({
        where: {
          expiresAt: { lt: now },
          isActive: true
        },
        select: { id: true, title: true }
      })
  
      if (expiredJobs.length > 0) {
        console.log(`[⚡] INSTANT CLEANUP: Found ${expiredJobs.length} expired jobs - DELETING NOW`)
        
        // Delete expired jobs immediately
        await prisma.job.deleteMany({
          where: { id: { in: expiredJobs.map(job => job.id) } }
        })
        
        // Broadcast immediate cleanup
        broadcastJobUpdate({
          type: 'INSTANT_CLEANUP',
          action: 'EXPIRED_JOBS_DELETED',
          count: expiredJobs.length,
          deletedJobs: expiredJobs.map(job => ({ id: job.id, title: job.title })),
          timestamp: new Date().toISOString(),
          latency: Date.now() - startTime
        })
      }
  
      // 2. ULTRA-FAST LINK VALIDATION - Validate job links every second
      const jobsToValidate = await prisma.job.findMany({
        where: {
          isActive: true,
          isScraped: true,
          OR: [
            { lastValidated: null },
            { lastValidated: { lt: new Date(Date.now() - 60 * 1000) } } // Validate every 60 seconds
          ]
        },
        take: 20, // Limit for performance
        select: { id: true, title: true, sourceId: true }
      })
  
      let validatedCount = 0
      let invalidCount = 0
      
      for (const job of jobsToValidate) {
        try {
          // Ultra-fast validation - check if source is active
          const isValid = await quickValidateJobLink(job)
          
          if (!isValid) {
            // Mark as invalid immediately
            await prisma.job.update({
              where: { id: job.id },
              data: { validityStatus: 'NOT_FOUND', lastValidated: now }
            })
            invalidCount++
            
            broadcastJobUpdate({
              type: 'LINK_VALIDATION',
              action: 'INVALID_LINK_FOUND',
              jobId: job.id,
              title: job.title,
              status: 'NOT_FOUND',
              timestamp: new Date().toISOString()
            })
          } else {
            // Update validation timestamp
            await prisma.job.update({
              where: { id: job.id },
              data: { lastValidated: now }
            })
            validatedCount++
          }
        } catch (error) {
          console.error(`[⚠️]  Link validation error for job ${job.id}:`, error.message)
        }
      }
  
      if (validatedCount > 0 || invalidCount > 0) {
        console.log(`[🔍] LINK VALIDATION: ${validatedCount} valid, ${invalidCount} invalid`)
      }
  
      // 3. REAL-TIME JOB UPDATES - Check for jobs needing immediate updates
      const jobsNeedingUpdates = await prisma.job.findMany({
        where: {
          isActive: true,
          OR: [
            { applicationDeadline: null },
            { expiresAt: null }
          ]
        },
        select: { id: true, title: true }
      })
  
      if (jobsNeedingUpdates.length > 0) {
        console.log(`[⏰] IMMEDIATE UPDATES: ${jobsNeedingUpdates.length} jobs need date updates`)
        
        // Apply immediate updates
        for (const job of jobsNeedingUpdates) {
          const now = new Date()
          await prisma.job.update({
            where: { id: job.id },
            data: {
              applicationDeadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
              expiresAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
            }
          })
        }
        
        broadcastJobUpdate({
          type: 'IMMEDIATE_UPDATES',
          action: 'DATES_UPDATED',
          count: jobsNeedingUpdates.length,
          timestamp: new Date().toISOString()
        })
      }
  
      // 4. ULTRA-FAST SYSTEM HEALTH - Minimal overhead check
      const [totalJobs, activeJobs] = await Promise.all([
        prisma.job.count(),
        prisma.job.count({ where: { isActive: true } })
      ])
  
      const monitoringDuration = Date.now() - startTime
      console.log(`[🏃] ULTRA-FAST Cycle ${monitoringCount} completed in ${monitoringDuration}ms`)
      console.log(`   🔥 Jobs: ${activeJobs}/${totalJobs} active`)
      console.log(`   ⚡ Latency: ${monitoringDuration}ms`)
  
      // Broadcast ultra-fast system health
      broadcastJobUpdate({
        type: 'ULTRA_FAST_HEALTH',
        data: {
          monitoringCycle: monitoringCount,
          totalJobs,
          activeJobs,
          cycleDurationMs: monitoringDuration,
          timestamp: new Date().toISOString(),
          performance: monitoringDuration < 100 ? 'EXCELLENT' : monitoringDuration < 500 ? 'GOOD' : 'SLOW'
        }
      })
  
    } catch (error) {
      console.error('[💥] ULTRA-FAST MONITORING ERROR:', error)
      broadcastJobUpdate({
        type: 'ULTRA_FAST_ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
    }
  }, 1000) // ⚡ 1-SECOND INTERVAL for ultra-fast monitoring

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

// Auto-start monitoring when this module is loaded
async function autoStartMonitoringIfNeeded() {
  if (autoStartAttempted || isMonitoring) return;
  
  autoStartAttempted = true;
  console.log('Attempting auto-start of job monitoring...');
  
  try {
    // Start monitoring automatically
    await startContinuousMonitoring();
    console.log('✅ Job monitoring auto-started successfully');
    
    // Also trigger initial cleanup and refresh
    await autoRefreshJobData();
    
  } catch (error) {
    console.error('❌ Failed to auto-start monitoring:', error);
  }
}

// Initialize auto-start for server-side only
if (typeof window === 'undefined') {
  // Small delay to ensure other systems are ready
  setTimeout(autoStartMonitoringIfNeeded, 2000);
}

// Ultra-fast job link validation function
async function quickValidateJobLink(job: any): Promise<boolean> {
  try {
    // For ultra-fast validation, we'll do a quick check
    // In production, this would check the actual job URL
    
    // 1. Check if job source exists and is active
    if (job.sourceId) {
      const source = await prisma.jobSource.findUnique({
        where: { id: job.sourceId }
      })
      
      if (!source || !source.isActive) {
        return false
      }
    }
    
    // 2. Check if job is too old (90+ days without validation)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    if (job.createdAt && job.createdAt < ninetyDaysAgo) {
      if (!job.lastValidated || job.lastValidated < ninetyDaysAgo) {
        return false // Too old, likely expired
      }
    }
    
    // 3. Check if application deadline has passed
    if (job.applicationDeadline && new Date(job.applicationDeadline) < new Date()) {
      return false // Deadline passed
    }
    
    // 4. Quick response - assume valid if all checks pass
    return true
    
  } catch (error) {
    console.error(`[⚠️]  Quick validation error for job ${job.id}:`, error instanceof Error ? error.message : 'Unknown error')
    return false // If we can't validate, assume invalid
  }
}

// Auto-refresh job data function
async function autoRefreshJobData() {
  console.log('🔄 Starting automatic job data refresh...');
  
  try {
    // 1. Clean up expired and invalid jobs
    console.log('🧹 Cleaning up expired jobs...');
    const cleanupResponse = await removeExpiredJobs(false); // Actually remove expired jobs
    const cleanupData = await cleanupResponse.json();
    
    if (cleanupData.success) {
      console.log(`🗑️  Removed ${cleanupData.data.jobsRemoved} expired jobs`);
    }
    
    // 2. Update job dates for active jobs
    console.log('📅 Updating job dates...');
    const updateResponse = await updateJobDates(false); // Actually update dates
    const updateData = await updateResponse.json();
    
    if (updateData.success) {
      console.log(`📆 Updated dates for ${updateData.data.jobsUpdated} jobs`);
    }
    
    // 3. Add fresh mock jobs to simulate new data
    console.log('✨ Adding fresh job data...');
    const freshJobsAdded = await addFreshMockJobs();
    console.log(`🆕 Added ${freshJobsAdded} fresh mock jobs`);
    
    console.log('🎉 Job data refresh completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in auto-refresh job data:', error);
  }
}

// Add fresh mock jobs to simulate new job postings
async function addFreshMockJobs() {
  const freshJobs = [
    {
      title: 'Senior Frontend Developer',
      description: 'We are looking for an experienced Senior Frontend Developer to lead our React team. You will work on cutting-edge web applications using modern JavaScript frameworks.',
      companyName: 'InnovateTech',
      location: 'San Francisco, CA',
      type: 'FULL_TIME',
      salaryMin: 120000,
      salaryMax: 160000,
      requirements: JSON.stringify(['React', 'TypeScript', 'Redux', 'Next.js', 'GraphQL']),
      benefits: 'Health insurance, 401k matching, Flexible hours, Remote work options',
      experience: '5+ years',
      isRemote: true,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isActive: true,
      validityStatus: 'VALID',
      lastValidated: new Date(),
      isScraped: false,
      lastScraped: null,
      authorId: 'demo-user-1',
      views: 0,
      applicationsCount: 0
    },
    {
      title: 'Backend Engineer (Node.js)',
      description: 'Join our backend team to build scalable microservices using Node.js and modern cloud technologies. Work with AWS, Docker, and Kubernetes in a fast-paced environment.',
      companyName: 'CloudScale Systems',
      location: 'Austin, TX',
      type: 'FULL_TIME',
      salaryMin: 110000,
      salaryMax: 150000,
      requirements: JSON.stringify(['Node.js', 'TypeScript', 'AWS', 'Docker', 'Kubernetes', 'REST APIs']),
      benefits: 'Unlimited PTO, Stock options, Health benefits, Remote work',
      experience: '3+ years',
      isRemote: true,
      applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
      validityStatus: 'VALID',
      lastValidated: new Date(),
      isScraped: false,
      lastScraped: null,
      authorId: 'demo-user-1',
      views: 0,
      applicationsCount: 0
    },
    {
      title: 'Full Stack Developer',
      description: 'We need a talented Full Stack Developer to work on our SaaS platform. You will build features end-to-end using React, Node.js, and modern cloud services.',
      companyName: 'SaaSify',
      location: 'New York, NY',
      type: 'FULL_TIME',
      salaryMin: 100000,
      salaryMax: 140000,
      requirements: JSON.stringify(['React', 'Node.js', 'TypeScript', 'AWS', 'SQL', 'REST APIs']),
      benefits: 'Health insurance, 401k, Flexible hours, Professional development budget',
      experience: '3+ years',
      isRemote: false,
      applicationDeadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
      isActive: true,
      validityStatus: 'VALID',
      lastValidated: new Date(),
      isScraped: false,
      lastScraped: null,
      authorId: 'demo-user-1',
      views: 0,
      applicationsCount: 0
    },
    {
      title: 'DevOps Engineer',
      description: 'Join our DevOps team to manage our cloud infrastructure. You will work with AWS, Kubernetes, Terraform, and CI/CD pipelines to ensure smooth deployments.',
      companyName: 'DevOpsPro',
      location: 'Seattle, WA',
      type: 'FULL_TIME',
      salaryMin: 115000,
      salaryMax: 155000,
      requirements: JSON.stringify(['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'Linux']),
      benefits: 'Health insurance, 401k, Remote work, Certification reimbursement',
      experience: '4+ years',
      isRemote: true,
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isActive: true,
      validityStatus: 'VALID',
      lastValidated: new Date(),
      isScraped: false,
      lastScraped: null,
      authorId: 'demo-user-1',
      views: 0,
      applicationsCount: 0
    },
    {
      title: 'Data Scientist',
      description: 'We are looking for a Data Scientist to analyze large datasets and build machine learning models. Experience with Python, SQL, and data visualization is required.',
      companyName: 'DataInsights Inc',
      location: 'Boston, MA',
      type: 'FULL_TIME',
      salaryMin: 105000,
      salaryMax: 145000,
      requirements: JSON.stringify(['Python', 'SQL', 'Machine Learning', 'Data Analysis', 'Pandas', 'NumPy']),
      benefits: 'Health insurance, 401k, Research budget, Conference attendance',
      experience: '3+ years',
      isRemote: false,
      applicationDeadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true,
      validityStatus: 'VALID',
      lastValidated: new Date(),
      isScraped: false,
      lastScraped: null,
      authorId: 'demo-user-1',
      views: 0,
      applicationsCount: 0
    }
  ];

  let jobsAdded = 0;

  for (const jobData of freshJobs) {
    try {
      await prisma.job.create({ data: jobData });
      jobsAdded++;
      
      // Broadcast the new job
      broadcastJobUpdate({
        type: 'JOB_CREATED',
        job: {
          id: 'fresh-' + jobsAdded,
          title: jobData.title,
          companyName: jobData.companyName,
          location: jobData.location,
          type: jobData.type,
          createdAt: jobData.createdAt.toISOString()
        }
      });
      
    } catch (error) {
      console.error('Error adding fresh job:', error);
    }
  }

  return jobsAdded;
}

// Set up periodic job refresh (every 24 hours)
function setupPeriodicJobRefresh() {
  console.log('🕒 Setting up periodic job refresh (every 24 hours)...');
  
  setInterval(async () => {
    console.log('🔄 Running scheduled job refresh...');
    await autoRefreshJobData();
  }, 24 * 60 * 60 * 1000); // 24 hours
}

// Start periodic refresh for server-side only
if (typeof window === 'undefined') {
  setupPeriodicJobRefresh();
}