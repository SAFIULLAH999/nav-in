import { logger } from '../utils/logger';

/**
 * Mock Redis Service for Testing
 *
 * This service provides a mock implementation of Redis functionality
 * for testing purposes when Redis server is not available.
 */
class MockRedisService {
  private store: Map<string, string> = new Map();
  private hashStore: Map<string, Map<string, string>> = new Map();
  private listStore: Map<string, string[]> = new Map();
  private setStore: Map<string, Set<string>> = new Map();
  private isConnected: boolean = true;

  constructor() {
    logger.info('🎭 Mock Redis service initialized');
  }

  // Connection methods
  async connect(): Promise<void> {
    this.isConnected = true;
    logger.info('🎭 Mock Redis connected');
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
    logger.info('🎭 Mock Redis disconnected');
  }

  isHealthy(): boolean {
    return this.isConnected;
  }

  // Cache operations
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      this.store.set(key, serializedValue);

      if (ttl) {
        // Simulate TTL by setting timeout to delete key
        setTimeout(() => {
          this.store.delete(key);
        }, ttl * 1000);
      }

      logger.debug(`🎭 Mock Redis SET: ${key}`);
    } catch (error) {
      logger.error('🎭 Mock Redis SET operation failed:', error);
      throw error;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = this.store.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('🎭 Mock Redis GET operation failed:', error);
      throw error;
    }
  }

  async delete(key: string): Promise<number> {
    try {
      const existed = this.store.delete(key);
      return existed ? 1 : 0;
    } catch (error) {
      logger.error('🎭 Mock Redis DELETE operation failed:', error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      return this.store.has(key);
    } catch (error) {
      logger.error('🎭 Mock Redis EXISTS operation failed:', error);
      throw error;
    }
  }

  async expire(key: string, seconds: number): Promise<number> {
    try {
      if (this.store.has(key)) {
        setTimeout(() => {
          this.store.delete(key);
        }, seconds * 1000);
        return 1;
      }
      return 0;
    } catch (error) {
      logger.error('🎭 Mock Redis EXPIRE operation failed:', error);
      throw error;
    }
  }

  // Hash operations
  async hset(key: string, field: string, value: any): Promise<number> {
    try {
      if (!this.hashStore.has(key)) {
        this.hashStore.set(key, new Map());
      }

      const hash = this.hashStore.get(key)!;
      const serializedValue = JSON.stringify(value);
      const existed = hash.has(field);
      hash.set(field, serializedValue);

      return existed ? 0 : 1;
    } catch (error) {
      logger.error('🎭 Mock Redis HSET operation failed:', error);
      throw error;
    }
  }

  async hget<T = any>(key: string, field: string): Promise<T | null> {
    try {
      const hash = this.hashStore.get(key);
      if (!hash) return null;

      const value = hash.get(field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('🎭 Mock Redis HGET operation failed:', error);
      throw error;
    }
  }

  async hgetall<T = any>(key: string): Promise<Record<string, T>> {
    try {
      const hash = this.hashStore.get(key);
      if (!hash) return {};

      const result: Record<string, T> = {};

      for (const [field, value] of hash.entries()) {
        result[field] = JSON.parse(value);
      }

      return result;
    } catch (error) {
      logger.error('🎭 Mock Redis HGETALL operation failed:', error);
      throw error;
    }
  }

  // List operations
  async lpush(key: string, ...values: any[]): Promise<number> {
    try {
      if (!this.listStore.has(key)) {
        this.listStore.set(key, []);
      }

      const list = this.listStore.get(key)!;
      const serializedValues = values.map(v => JSON.stringify(v));
      list.unshift(...serializedValues);

      return list.length;
    } catch (error) {
      logger.error('🎭 Mock Redis LPUSH operation failed:', error);
      throw error;
    }
  }

  async rpop<T = any>(key: string): Promise<T | null> {
    try {
      const list = this.listStore.get(key);
      if (!list || list.length === 0) return null;

      const value = list.pop()!;
      return JSON.parse(value);
    } catch (error) {
      logger.error('🎭 Mock Redis RPOP operation failed:', error);
      throw error;
    }
  }

  async llen(key: string): Promise<number> {
    try {
      const list = this.listStore.get(key);
      return list ? list.length : 0;
    } catch (error) {
      logger.error('🎭 Mock Redis LLEN operation failed:', error);
      throw error;
    }
  }

  // Set operations
  async sadd(key: string, ...members: any[]): Promise<number> {
    try {
      if (!this.setStore.has(key)) {
        this.setStore.set(key, new Set());
      }

      const set = this.setStore.get(key)!;
      const serializedMembers = members.map(m => JSON.stringify(m));
      let addedCount = 0;

      for (const member of serializedMembers) {
        if (!set.has(member)) {
          set.add(member);
          addedCount++;
        }
      }

      return addedCount;
    } catch (error) {
      logger.error('🎭 Mock Redis SADD operation failed:', error);
      throw error;
    }
  }

  async smembers<T = any>(key: string): Promise<T[]> {
    try {
      const set = this.setStore.get(key);
      if (!set) return [];

      return Array.from(set).map(m => JSON.parse(m));
    } catch (error) {
      logger.error('🎭 Mock Redis SMEMBERS operation failed:', error);
      throw error;
    }
  }

  async sismember(key: string, member: any): Promise<boolean> {
    try {
      const set = this.setStore.get(key);
      if (!set) return false;

      const serializedMember = JSON.stringify(member);
      return set.has(serializedMember);
    } catch (error) {
      logger.error('🎭 Mock Redis SISMEMBER operation failed:', error);
      throw error;
    }
  }

  // Key pattern operations
  async keys(pattern: string): Promise<string[]> {
    try {
      const allKeys = [
        ...Array.from(this.store.keys()),
        ...Array.from(this.hashStore.keys()),
        ...Array.from(this.listStore.keys()),
        ...Array.from(this.setStore.keys())
      ];

      // Simple pattern matching (supports * wildcard)
      const regexPattern = pattern.replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);

      return allKeys.filter(key => regex.test(key));
    } catch (error) {
      logger.error('🎭 Mock Redis KEYS operation failed:', error);
      throw error;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    try {
      const keysToDelete = await this.keys(pattern);
      let deletedCount = 0;

      for (const key of keysToDelete) {
        if (this.store.delete(key)) deletedCount++;
        if (this.hashStore.delete(key)) deletedCount++;
        if (this.listStore.delete(key)) deletedCount++;
        if (this.setStore.delete(key)) deletedCount++;
      }

      return deletedCount;
    } catch (error) {
      logger.error('🎭 Mock Redis DELETE PATTERN operation failed:', error);
      throw error;
    }
  }

  // Utility methods
  async ping(): Promise<string> {
    return 'PONG';
  }

  async flushdb(): Promise<string> {
    this.store.clear();
    this.hashStore.clear();
    this.listStore.clear();
    this.setStore.clear();
    return 'OK';
  }

  // Queue operations for BullMQ compatibility
  async addToQueue(queueName: string, jobData: any): Promise<string> {
    try {
      const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const job = {
        id: jobId,
        data: jobData,
        timestamp: new Date().toISOString(),
        status: 'waiting'
      };

      await this.lpush(`${queueName}:jobs`, job);
      return jobId;
    } catch (error) {
      logger.error('🎭 Mock Redis ADD TO QUEUE operation failed:', error);
      throw error;
    }
  }

  async getFromQueue(queueName: string): Promise<any | null> {
    try {
      return await this.rpop(`${queueName}:jobs`);
    } catch (error) {
      logger.error('🎭 Mock Redis GET FROM QUEUE operation failed:', error);
      throw error;
    }
  }

  async getQueueLength(queueName: string): Promise<number> {
    try {
      return await this.llen(`${queueName}:jobs`);
    } catch (error) {
      logger.error('🎭 Mock Redis GET QUEUE LENGTH operation failed:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
export const mockRedisClient = new MockRedisService();
export const mockRedisService = new MockRedisService();
