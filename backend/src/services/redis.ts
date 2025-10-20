import Redis from 'ioredis';
import { logger } from '../utils/logger';

class RedisService {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.client.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    this.client.on('ready', () => {
      this.isConnected = true;
      logger.info('Redis client ready and connected');
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      logger.error('Redis client error:', error);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis connection closed');
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting...');
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      this.isConnected = false;
    } catch (error) {
      logger.error('Failed to disconnect from Redis:', error);
      throw error;
    }
  }

  getClient(): Redis {
    return this.client;
  }

  isHealthy(): boolean {
    return this.isConnected && this.client.status === 'ready';
  }

  // Cache operations
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.client.setex(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      logger.error('Redis SET operation failed:', error);
      throw error;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET operation failed:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error('Redis DELETE operation failed:', error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS operation failed:', error);
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.error('Redis EXPIRE operation failed:', error);
      throw error;
    }
  }

  // Hash operations
  async hset(key: string, field: string, value: any): Promise<number> {
    try {
      return await this.client.hset(key, field, JSON.stringify(value));
    } catch (error) {
      logger.error('Redis HSET operation failed:', error);
      throw error;
    }
  }

  async hget<T = any>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.client.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis HGET operation failed:', error);
      throw error;
    }
  }

  async hgetall<T = any>(key: string): Promise<Record<string, T>> {
    try {
      const hash = await this.client.hgetall(key);
      const result: Record<string, T> = {};

      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }

      return result;
    } catch (error) {
      logger.error('Redis HGETALL operation failed:', error);
      throw error;
    }
  }

  // List operations
  async lpush(key: string, ...values: any[]): Promise<number> {
    try {
      const serializedValues = values.map(v => JSON.stringify(v));
      return await this.client.lpush(key, ...serializedValues);
    } catch (error) {
      logger.error('Redis LPUSH operation failed:', error);
      throw error;
    }
  }

  async rpop<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.client.rpop(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis RPOP operation failed:', error);
      throw error;
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.client.llen(key);
    } catch (error) {
      logger.error('Redis LLEN operation failed:', error);
      throw error;
    }
  }

  // Set operations
  async sadd(key: string, ...members: any[]): Promise<number> {
    try {
      const serializedMembers = members.map(m => JSON.stringify(m));
      return await this.client.sadd(key, ...serializedMembers);
    } catch (error) {
      logger.error('Redis SADD operation failed:', error);
      throw error;
    }
  }

  async smembers<T = any>(key: string): Promise<T[]> {
    try {
      const members = await this.client.smembers(key);
      return members.map(m => JSON.parse(m));
    } catch (error) {
      logger.error('Redis SMEMBERS operation failed:', error);
      throw error;
    }
  }

  async sismember(key: string, member: any): Promise<boolean> {
    try {
      const result = await this.client.sismember(key, JSON.stringify(member));
      return result === 1;
    } catch (error) {
      logger.error('Redis SISMEMBER operation failed:', error);
      throw error;
    }
  }

  // Key pattern operations
  async keys(pattern: string): Promise<string[]> {
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Redis KEYS operation failed:', error);
      throw error;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      return await this.client.del(...keys);
    } catch (error) {
      logger.error('Redis DELETE PATTERN operation failed:', error);
      throw error;
    }
  }

  // Utility methods
  async ping(): Promise<string> {
    try {
      return await this.client.ping();
    } catch (error) {
      logger.error('Redis PING operation failed:', error);
      throw error;
    }
  }

  async flushdb(): Promise<string> {
    try {
      return await this.client.flushdb();
    } catch (error) {
      logger.error('Redis FLUSHDB operation failed:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const redisClient = new RedisService().getClient();
export const redisService = new RedisService();