import { Queue, Worker, Job } from 'bullmq';
import { redisClient } from './redis';
import { logger } from '../utils/logger';
import { JobScraperManager } from '../../../lib/job-scrapers/scraper-manager';
import { prisma } from '../utils/prisma';

// Create queue instance with error handling for build time
let jobQueue: Queue | null = null;
try {
  jobQueue = new Queue('job-processing', {
    connection: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
    },
  });
} catch (error) {
  console.warn('Redis not available during build, queue operations will be disabled');
}

// Export queue and worker instances
export { jobQueue, jobWorker };

// Queue job types
export interface JobData {
  type: 'email' | 'notification' | 'data-processing' | 'cleanup' | 'backup' | 'job-fetching';
  payload: any;
  priority?: number;
  delay?: number;
}

// Email job processor
const processEmailJob = async (job: Job<JobData>) => {
  logger.info('Processing email job:', job.data);

  try {
    // TODO: Implement email sending logic
    // const { to, subject, template, data } = job.data.payload;

    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing

    logger.info('Email job completed successfully');
    return { success: true };
  } catch (error) {
    logger.error('Email job failed:', error);
    throw error;
  }
};

// Notification job processor
const processNotificationJob = async (job: Job<JobData>) => {
  logger.info('Processing notification job:', job.data);

  try {
    const { userId, type, title, message, data } = job.data.payload;

    // Create notification in database
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        isRead: false,
      },
    });

    logger.info('Notification job completed successfully');
    return { success: true };
  } catch (error) {
    logger.error('Notification job failed:', error);
    throw error;
  }
};

// Data processing job processor
const processDataJob = async (job: Job<JobData>) => {
  logger.info('Processing data job:', job.data);

  try {
    // TODO: Implement data processing logic
    // const { operation, data } = job.data.payload;

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing

    logger.info('Data processing job completed successfully');
    return { success: true };
  } catch (error) {
    logger.error('Data processing job failed:', error);
    throw error;
  }
};

// Cleanup job processor
const processCleanupJob = async (job: Job<JobData>) => {
  logger.info('Processing cleanup job:', job.data);

  try {
    // TODO: Implement cleanup logic
    // const { type, olderThan } = job.data.payload;

    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing

    logger.info('Cleanup job completed successfully');
    return { success: true };
  } catch (error) {
    logger.error('Cleanup job failed:', error);
    throw error;
  }
};

// Backup job processor
const processBackupJob = async (job: Job<JobData>) => {
  logger.info('Processing backup job:', job.data);

  try {
    // TODO: Implement backup logic
    // const { type, destination } = job.data.payload;

    await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate processing

    logger.info('Backup job completed successfully');
    return { success: true };
  } catch (error) {
    logger.error('Backup job failed:', error);
    throw error;
  }
};

// Job fetching processor
const processJobFetchingJob = async (job: Job<JobData>) => {
  logger.info('Processing job fetching job:', job.data);

  try {
    const scraperManager = new JobScraperManager();
    const { searchQuery, location, limit } = job.data.payload;

    // Check current job count in database
    const currentJobCount = await prisma.job.count({
      where: { isActive: true }
    });

    // Stop fetching if we have 100 or more jobs
    if (currentJobCount >= 100) {
      logger.info(`Job limit reached (${currentJobCount} jobs). Stopping job fetching.`);
      return { success: true, message: 'Job limit reached' };
    }

    // Calculate how many jobs to fetch (max 20 at a time to reach 100)
    const jobsToFetch = Math.min(limit || 20, 100 - currentJobCount);

    logger.info(`Current jobs: ${currentJobCount}, Fetching: ${jobsToFetch} new jobs`);

    await scraperManager.scrapeAllJobs(searchQuery || 'software engineer', location || 'remote', jobsToFetch);

    logger.info('Job fetching completed successfully');
    return { success: true, fetched: jobsToFetch, total: currentJobCount + jobsToFetch };
  } catch (error) {
    logger.error('Job fetching failed:', error);
    throw error;
  }
};

// Create worker instance with error handling for build time
let jobWorker: Worker<JobData> | null = null;
try {
  jobWorker = new Worker<JobData>(
    'job-processing',
    async (job: Job<JobData>) => {
      logger.info(`Processing job ${job.id} of type ${job.data.type}`);

      switch (job.data.type) {
        case 'email':
          return await processEmailJob(job);
        case 'notification':
          return await processNotificationJob(job);
        case 'data-processing':
          return await processDataJob(job);
        case 'cleanup':
          return await processCleanupJob(job);
        case 'backup':
          return await processBackupJob(job);
        case 'job-fetching':
          return await processJobFetchingJob(job);
        default:
          throw new Error(`Unknown job type: ${job.data.type}`);
      }
    },
    {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB || '0'),
      },
      concurrency: parseInt(process.env.QUEUE_CONCURRENCY || '5'),
    }
  );
} catch (error) {
  console.warn('Redis not available during build, worker will be disabled');
}

// Worker event handlers
if (jobWorker) {
  jobWorker.on('completed', (job: Job<JobData>) => {
    logger.info(`Job ${job.id} completed successfully`);
  });

  jobWorker.on('failed', (job: Job<JobData> | undefined, error: Error) => {
    logger.error(`Job ${job?.id} failed:`, error);
  });

  jobWorker.on('error', (error: Error) => {
    logger.error('Worker error:', error);
  });
}

// Queue management functions
export const addJob = async (jobData: JobData): Promise<Job<JobData> | null> => {
  if (!jobQueue) {
    logger.warn('Queue not available, skipping job creation');
    return null;
  }

  const job = await jobQueue.add(
    `${jobData.type}-${Date.now()}`,
    jobData,
    {
      priority: jobData.priority || 0,
      delay: jobData.delay || 0,
      attempts: parseInt(process.env.JOB_RETRY_ATTEMPTS || '3'),
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  );

  logger.info(`Added job ${job.id} to queue`);
  return job;
};

export const addEmailJob = async (payload: any, priority?: number, delay?: number): Promise<Job<JobData> | null> => {
  return addJob({
    type: 'email',
    payload,
    priority,
    delay,
  });
};

export const addNotificationJob = async (payload: any, priority?: number, delay?: number): Promise<Job<JobData> | null> => {
  return addJob({
    type: 'notification',
    payload,
    priority,
    delay,
  });
};

export const addDataProcessingJob = async (payload: any, priority?: number, delay?: number): Promise<Job<JobData> | null> => {
  return addJob({
    type: 'data-processing',
    payload,
    priority,
    delay,
  });
};

export const addCleanupJob = async (payload: any, priority?: number, delay?: number): Promise<Job<JobData> | null> => {
  return addJob({
    type: 'cleanup',
    payload,
    priority,
    delay,
  });
};

export const addBackupJob = async (payload: any, priority?: number, delay?: number): Promise<Job<JobData> | null> => {
  return addJob({
    type: 'backup',
    payload,
    priority,
    delay,
  });
};

export const addJobFetchingJob = async (payload: any, priority?: number, delay?: number): Promise<Job<JobData> | null> => {
  return addJob({
    type: 'job-fetching',
    payload,
    priority,
    delay,
  });
};

// Queue monitoring functions
export const getQueueStats = async () => {
  if (!jobQueue) {
    return {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }

  const [waiting, active, completed, failed, delayed] = await Promise.all([
    jobQueue.getWaiting(),
    jobQueue.getActive(),
    jobQueue.getCompleted(),
    jobQueue.getFailed(),
    jobQueue.getDelayed(),
  ]);

  return {
    waiting: waiting.length,
    active: active.length,
    completed: completed.length,
    failed: failed.length,
    delayed: delayed.length,
  };
};

export const getQueueJobs = async (status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' = 'waiting', start = 0, end = 9) => {
  if (!jobQueue) {
    return [];
  }

  switch (status) {
    case 'waiting':
      return await jobQueue.getWaiting(start, end);
    case 'active':
      return await jobQueue.getActive(start, end);
    case 'completed':
      return await jobQueue.getCompleted(start, end);
    case 'failed':
      return await jobQueue.getFailed(start, end);
    case 'delayed':
      return await jobQueue.getDelayed(start, end);
    default:
      return [];
  }
};

// Graceful shutdown
export const closeQueue = async () => {
  logger.info('Closing job queue...');
  if (jobWorker) {
    await jobWorker.close();
  }
  if (jobQueue) {
    await jobQueue.close();
  }
  logger.info('Job queue closed');
};

// Initialize queue service
export const initializeQueue = () => {
  logger.info('Job queue service initialized');

  // Handle process termination
  process.on('SIGTERM', closeQueue);
  process.on('SIGINT', closeQueue);
};
