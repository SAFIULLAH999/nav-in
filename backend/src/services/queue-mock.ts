import { mockRedisService } from './redis-mock';
import { logger } from '../utils/logger';

// Mock Job interface
interface MockJob {
  id: string;
  name: string;
  data: any;
  priority: number;
  delay: number;
  attempts: number;
  timestamp: number;
  status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
}

// Mock Queue class
class MockQueue {
  private queueName: string;
  private waitingJobs: MockJob[] = [];
  private activeJobs: MockJob[] = [];
  private completedJobs: MockJob[] = [];
  private failedJobs: MockJob[] = [];
  private delayedJobs: MockJob[] = [];

  constructor(queueName: string) {
    this.queueName = queueName;
    logger.info(`🎭 Mock Queue "${queueName}" initialized`);
  }

  async add(jobName: string, data: any, options: { priority?: number; delay?: number; attempts?: number } = {}): Promise<MockJob> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const timestamp = Date.now();

    const job: MockJob = {
      id: jobId,
      name: jobName,
      data,
      priority: options.priority || 0,
      delay: options.delay || 0,
      attempts: options.attempts || 3,
      timestamp,
      status: options.delay && options.delay > 0 ? 'delayed' : 'waiting'
    };

    if (job.status === 'delayed') {
      this.delayedJobs.push(job);
      setTimeout(() => {
        this.moveToWaiting(job.id);
      }, job.delay);
    } else {
      this.waitingJobs.push(job);
    }

    // Sort by priority (higher priority first)
    this.waitingJobs.sort((a, b) => b.priority - a.priority);

    logger.debug(`🎭 Mock Queue: Added job ${jobId} with priority ${job.priority}`);

    return job;
  }

  private moveToWaiting(jobId: string) {
    const index = this.delayedJobs.findIndex(job => job.id === jobId);
    if (index !== -1) {
      const [job] = this.delayedJobs.splice(index, 1);
      job.status = 'waiting';
      this.waitingJobs.push(job);
      this.waitingJobs.sort((a, b) => b.priority - a.priority);
      logger.debug(`🎭 Mock Queue: Moved delayed job ${jobId} to waiting`);
    }
  }

  async getWaiting(start?: number, end?: number): Promise<MockJob[]> {
    const startIndex = start || 0;
    const endIndex = end !== undefined ? end : this.waitingJobs.length - 1;
    return this.waitingJobs.slice(startIndex, endIndex + 1);
  }

  async getActive(start?: number, end?: number): Promise<MockJob[]> {
    const startIndex = start || 0;
    const endIndex = end !== undefined ? end : this.activeJobs.length - 1;
    return this.activeJobs.slice(startIndex, endIndex + 1);
  }

  async getCompleted(start?: number, end?: number): Promise<MockJob[]> {
    const startIndex = start || 0;
    const endIndex = end !== undefined ? end : this.completedJobs.length - 1;
    return this.completedJobs.slice(startIndex, endIndex + 1);
  }

  async getFailed(start?: number, end?: number): Promise<MockJob[]> {
    const startIndex = start || 0;
    const endIndex = end !== undefined ? end : this.failedJobs.length - 1;
    return this.failedJobs.slice(startIndex, endIndex + 1);
  }

  async getDelayed(start?: number, end?: number): Promise<MockJob[]> {
    const startIndex = start || 0;
    const endIndex = end !== undefined ? end : this.delayedJobs.length - 1;
    return this.delayedJobs.slice(startIndex, endIndex + 1);
  }

  async getNextJob(): Promise<MockJob | null> {
    if (this.waitingJobs.length === 0) {
      return null;
    }

    const job = this.waitingJobs.shift()!;
    job.status = 'active';
    this.activeJobs.push(job);

    logger.debug(`🎭 Mock Queue: Moved job ${job.id} to active`);

    return job;
  }

  async completeJob(jobId: string, result: any): Promise<void> {
    const activeIndex = this.activeJobs.findIndex(job => job.id === jobId);
    if (activeIndex !== -1) {
      const [job] = this.activeJobs.splice(activeIndex, 1);
      job.status = 'completed';
      job.data.result = result;
      this.completedJobs.push(job);
      logger.debug(`🎭 Mock Queue: Completed job ${jobId}`);
    }
  }

  async failJob(jobId: string, error: any): Promise<void> {
    const activeIndex = this.activeJobs.findIndex(job => job.id === jobId);
    if (activeIndex !== -1) {
      const [job] = this.activeJobs.splice(activeIndex, 1);

      if (job.attempts > 1) {
        // Retry the job
        job.attempts--;
        job.status = 'waiting';
        this.waitingJobs.push(job);
        this.waitingJobs.sort((a, b) => b.priority - a.priority);
        logger.debug(`🎭 Mock Queue: Retrying job ${jobId} (${job.attempts} attempts left)`);
      } else {
        // Mark as failed
        job.status = 'failed';
        job.data.error = error;
        this.failedJobs.push(job);
        logger.debug(`🎭 Mock Queue: Failed job ${jobId}`);
      }
    }
  }

  async close(): Promise<void> {
    logger.info(`🎭 Mock Queue "${this.queueName}" closed`);
  }

  async getStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    return {
      waiting: this.waitingJobs.length,
      active: this.activeJobs.length,
      completed: this.completedJobs.length,
      failed: this.failedJobs.length,
      delayed: this.delayedJobs.length
    };
  }
}

// Mock Worker class
class MockWorker {
  private queue: MockQueue;
  private isRunning: boolean = true;
  private concurrency: number;

  constructor(queue: MockQueue, concurrency: number = 5) {
    this.queue = queue;
    this.concurrency = concurrency;
    logger.info(`🎭 Mock Worker initialized with concurrency ${concurrency}`);

    // Start processing jobs
    this.startProcessing();
  }

  private async startProcessing() {
    for (let i = 0; i < this.concurrency; i++) {
      this.processJobs();
    }
  }

  private async processJobs() {
    while (this.isRunning) {
      try {
        const job = await this.queue.getNextJob();
        if (!job) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before checking again
          continue;
        }

        logger.info(`🎭 Mock Worker: Processing job ${job.id} of type ${job.name}`);

        // Simulate job processing
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simulate success/failure
        const shouldFail = Math.random() < 0.1; // 10% chance of failure

        if (shouldFail) {
          await this.queue.failJob(job.id, 'Simulated processing error');
          this.emit('failed', job, new Error('Simulated processing error'));
        } else {
          await this.queue.completeJob(job.id, { success: true });
          this.emit('completed', job);
        }

      } catch (error) {
        logger.error('🎭 Mock Worker: Error processing job:', error);
      }
    }
  }

  async close(): Promise<void> {
    this.isRunning = false;
    logger.info('🎭 Mock Worker closed');
  }

  // Event emitter simulation
  private listeners: Record<string, ((...args: any[]) => void)[]> = {};

  on(event: string, listener: (...args: any[]) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  private emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      for (const listener of this.listeners[event]) {
        listener(...args);
      }
    }
  }
}

// Mock Job Queue Manager
class MockJobQueueManager {
  private queue: MockQueue;
  private worker: MockWorker;

  constructor() {
    this.queue = new MockQueue('job-processing');
    this.worker = new MockWorker(this.queue, 5);
  }

  async addJob(jobData: {
    type: string;
    data: any;
    priority?: number;
    scheduledFor?: Date;
  }): Promise<string> {
    const delay = jobData.scheduledFor
      ? Math.max(0, jobData.scheduledFor.getTime() - Date.now())
      : 0;

    const job = await this.queue.add(
      `${jobData.type}-${Date.now()}`,
      jobData.data,
      {
        priority: jobData.priority || 0,
        delay: delay,
        attempts: 3
      }
    );

    return job.id;
  }

  async getNextJob(): Promise<MockJob | null> {
    return await this.queue.getNextJob();
  }

  async updateJobStatus(jobId: string, status: string, data: any): Promise<void> {
    // In a real implementation, this would update the job status in the database
    logger.debug(`🎭 Mock Job Queue: Updated job ${jobId} status to ${status}`);
  }

  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  }> {
    const stats = await this.queue.getStats();
    return {
      pending: stats.waiting,
      processing: stats.active,
      completed: stats.completed,
      failed: stats.failed,
      total: stats.waiting + stats.active + stats.completed + stats.failed
    };
  }

  async cleanupOldJobs(daysOld: number): Promise<number> {
    // In a real implementation, this would clean up old jobs
    logger.debug(`🎭 Mock Job Queue: Cleanup old jobs (${daysOld} days)`);
    return 0;
  }

  async getJobsByType(jobType: string, limit: number): Promise<any[]> {
    // In a real implementation, this would get jobs by type
    logger.debug(`🎭 Mock Job Queue: Get jobs by type ${jobType} (limit: ${limit})`);
    return [];
  }
}

// Export mock queue and worker instances
export const mockJobQueue = new MockQueue('job-processing');
export const mockJobWorker = new MockWorker(mockJobQueue, 5);
export const mockJobQueueManager = new MockJobQueueManager();

// Export types for compatibility
export interface JobData {
  type: string;
  payload: any;
  priority?: number;
  delay?: number;
}
