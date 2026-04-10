import Redis from 'ioredis'

// Create Redis client for Next.js API routes
const createRedisClient = () => {
  if (!process.env.REDIS_URL) {
    return null
  }

  return new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    lazyConnect: true,
  })
}

export const redis = createRedisClient()

// Cache wrapper with fallback
export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redis) return null
  
  try {
    const value = await redis.get(key)
    return value ? JSON.parse(value) : null
  } catch (error) {
    console.warn('Redis GET failed:', error)
    return null
  }
}

export async function cacheSet(key: string, value: any, ttl: number = 300): Promise<void> {
  if (!redis) return
  
  try {
    await redis.setex(key, ttl, JSON.stringify(value))
  } catch (error) {
    console.warn('Redis SET failed:', error)
  }
}

export async function cacheDelete(key: string): Promise<void> {
  if (!redis) return
  
  try {
    await redis.del(key)
  } catch (error) {
    console.warn('Redis DELETE failed:', error)
  }
}

export async function cacheDeletePattern(pattern: string): Promise<void> {
  if (!redis) return
  
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  } catch (error) {
    console.warn('Redis DELETE PATTERN failed:', error)
  }
}