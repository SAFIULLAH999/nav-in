import Ably from 'ably';
import { logger } from '../utils/logger';

// Ably client for publishing real-time events
class AblyService {
  private client: Ably.Realtime;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Ably.Realtime({
      key: process.env.ABLY_API_KEY,
      autoConnect: false,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.connection.on('connected', () => {
      this.isConnected = true;
      logger.info('Ably connected successfully');
    });

    this.client.connection.on('failed', (stateChange) => {
      this.isConnected = false;
      logger.error('Ably connection failed:', stateChange.reason);
    });

    this.client.connection.on('disconnected', () => {
      this.isConnected = false;
      logger.warn('Ably disconnected');
    });

    this.client.connection.on('connecting', () => {
      logger.info('Ably connecting...');
    });
  }

  async connect(): Promise<void> {
    try {
      if (!process.env.ABLY_API_KEY) {
        logger.warn('Ably API key not configured, skipping Ably connection');
        return;
      }

      await this.client.connection.connect();
    } catch (error) {
      logger.error('Failed to connect to Ably:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.connection.close();
      this.isConnected = false;
    } catch (error) {
      logger.error('Failed to disconnect from Ably:', error);
      throw error;
    }
  }

  isHealthy(): boolean {
    return this.isConnected && this.client.connection.state === 'connected';
  }

  // Get channel for publishing events
  getChannel(channelName: string) {
    return this.client.channels.get(channelName);
  }

  // Publish event to channel
  async publish(channelName: string, eventName: string, data: any): Promise<void> {
    try {
      if (!this.isConnected) {
        logger.warn('Ably not connected, skipping publish');
        return;
      }

      const channel = this.getChannel(channelName);
      await channel.publish(eventName, {
        ...data,
        timestamp: new Date().toISOString(),
      });

      logger.debug(`Published ${eventName} to ${channelName}`);
    } catch (error) {
      logger.error(`Failed to publish ${eventName} to ${channelName}:`, error);
      throw error;
    }
  }

  // Publish user-specific events
  async publishToUser(userId: string, eventName: string, data: any): Promise<void> {
    await this.publish(`user:${userId}`, eventName, data);
  }

  // Publish global events
  async publishGlobal(eventName: string, data: any): Promise<void> {
    await this.publish('global', eventName, data);
  }

  // Publish connection-specific events
  async publishToConnections(userId: string, eventName: string, data: any): Promise<void> {
    await this.publish(`connections:${userId}`, eventName, data);
  }

  // Publish post-specific events
  async publishToPost(postId: string, eventName: string, data: any): Promise<void> {
    await this.publish(`post:${postId}`, eventName, data);
  }

  // Publish job-specific events
  async publishToJob(jobId: string, eventName: string, data: any): Promise<void> {
    await this.publish(`job:${jobId}`, eventName, data);
  }
}

// Create and export singleton instance
export const ablyService = new AblyService();

// Event type definitions for better type safety
export interface AblyEventData {
  userId?: string;
  postId?: string;
  jobId?: string;
  messageId?: string;
  connectionId?: string;
  notificationId?: string;
  [key: string]: any;
}

// Real-time event types
export const AblyEventTypes = {
  // User events
  USER_ONLINE: 'user:online',
  USER_OFFLINE: 'user:offline',
  USER_TYPING: 'user:typing',
  USER_STOPPED_TYPING: 'user:stopped_typing',

  // Post events
  POST_CREATED: 'post:created',
  POST_UPDATED: 'post:updated',
  POST_DELETED: 'post:deleted',
  POST_LIKED: 'post:liked',
  POST_UNLIKED: 'post:unliked',
  POST_COMMENTED: 'post:commented',
  POST_SHARED: 'post:shared',

  // Message events
  MESSAGE_SENT: 'message:sent',
  MESSAGE_READ: 'message:read',
  MESSAGE_DELETED: 'message:deleted',

  // Connection events
  CONNECTION_REQUEST_SENT: 'connection:request_sent',
  CONNECTION_REQUEST_ACCEPTED: 'connection:request_accepted',
  CONNECTION_REQUEST_REJECTED: 'connection:request_rejected',
  CONNECTION_REMOVED: 'connection:removed',

  // Job events
  JOB_CREATED: 'job:created',
  JOB_UPDATED: 'job:updated',
  JOB_DELETED: 'job:deleted',
  JOB_APPLICATION_SUBMITTED: 'job:application_submitted',
  JOB_APPLICATION_UPDATED: 'job:application_updated',

  // Notification events
  NOTIFICATION_CREATED: 'notification:created',
  NOTIFICATIONS_MARKED_READ: 'notifications:marked_read',

  // Global events
  USER_JOINED: 'global:user_joined',
  USER_LEFT: 'global:user_left',
} as const;

// Helper functions for common real-time events
export const publishPostEvent = async (postId: string, eventType: string, data: AblyEventData) => {
  await ablyService.publishToPost(postId, eventType, data);
};

export const publishUserEvent = async (userId: string, eventType: string, data: AblyEventData) => {
  await ablyService.publishToUser(userId, eventType, data);
};

export const publishConnectionEvent = async (userId: string, eventType: string, data: AblyEventData) => {
  await ablyService.publishToConnections(userId, eventType, data);
};

export const publishJobEvent = async (jobId: string, eventType: string, data: AblyEventData) => {
  await ablyService.publishToJob(jobId, eventType, data);
};

export const publishGlobalEvent = async (eventType: string, data: AblyEventData) => {
  await ablyService.publishGlobal(eventType, data);
};

// Initialize Ably service
export const initializeAbly = async () => {
  if (process.env.ABLY_API_KEY) {
    await ablyService.connect();
    logger.info('Ably real-time service initialized');
  } else {
    logger.warn('Ably API key not configured, real-time features will be disabled');
  }
};

export default ablyService;