#!/usr/bin/env tsx

import { addJobFetchingJob } from './services/queue'
import { logger } from './utils/logger'

/**
 * Schedule recurring job fetching
 *
 * This script schedules job fetching to run every hour
 * Run with: npm run schedule-jobs
 */

async function scheduleRecurringJobFetching() {
  logger.info('🚀 Scheduling recurring job fetching...')

  try {
    // Schedule immediate job fetching
    const immediateJob = await addJobFetchingJob({
      searchQuery: 'software engineer',
      location: 'remote',
      limit: 50
    })
    logger.info(`✅ Immediate job fetching scheduled: ${immediateJob.id}`)

    // Schedule job fetching every 5 seconds (5000 ms)
    const recurringJob = await addJobFetchingJob({
      searchQuery: 'software engineer',
      location: 'remote',
      limit: 20 // Fetch 20 jobs at a time to reach 100 total
    }, 0, 5000) // 5 seconds delay
    logger.info(`✅ Recurring job fetching scheduled: ${recurringJob.id}`)

    logger.info('📋 Job fetching scheduled successfully')
    logger.info('🔄 Jobs will run every hour')

  } catch (error) {
    logger.error('❌ Error scheduling job fetching:', error)
    process.exit(1)
  }
}

// Run if this file is executed directly
if (require.main === module) {
  scheduleRecurringJobFetching()
}

export { scheduleRecurringJobFetching }
