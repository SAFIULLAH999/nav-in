import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../services/redis';
import { logger, logSecurityEvent } from '../utils/logger';

// Rate limiter configurations
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  message: {
    success: false,
    error: {
      message: 'Too many requests from this IP, please try again later.',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logSecurityEvent('Rate limit exceeded', 'medium', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });

    res.status(429).json({
      success: false,
      error: {
        message: 'Too many requests from this IP, please try again later.',
        statusCode: 429,
      },
    });
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.originalUrl === '/health';
  },
});

// Strict rate limiter for authentication routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later.',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logSecurityEvent('Auth rate limit exceeded', 'high', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });

    res.status(429).json({
      success: false,
      error: {
        message: 'Too many authentication attempts, please try again later.',
        statusCode: 429,
      },
    });
  },
});

// File upload rate limiter (more restrictive)
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: {
    success: false,
    error: {
      message: 'Upload limit exceeded, please try again later.',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logSecurityEvent('Upload rate limit exceeded', 'medium', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
      userAgent: req.get('User-Agent'),
    });

    res.status(429).json({
      success: false,
      error: {
        message: 'Upload limit exceeded, please try again later.',
        statusCode: 429,
      },
    });
  },
});

// Custom rate limiter using Redis for more sophisticated limiting
export class CustomRateLimiter {
  private redis = redisClient;
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = WINDOW_MS, maxRequests: number = MAX_REQUESTS) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  async checkLimit(key: string, maxRequests?: number): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      const now = Date.now();
      const windowStart = now - this.windowMs;
      const limit = maxRequests || this.maxRequests;

      // Clean old requests
      await this.redis.zremrangebyscore(key, 0, windowStart);

      // Count current requests
      const requestCount = await this.redis.zcard(key);

      if (requestCount < limit) {
        // Add current request
        await this.redis.zadd(key, now, `${now}-${Math.random()}`);

        // Set expiry for the key
        await this.redis.expire(key, Math.ceil(this.windowMs / 1000));

        return {
          allowed: true,
          remaining: limit - requestCount - 1,
          resetTime: now + this.windowMs,
        };
      }

      // Get the oldest request to calculate reset time
      const oldestRequest = await this.redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = oldestRequest.length > 0 ? parseInt(oldestRequest[1]) + this.windowMs : now + this.windowMs;

      return {
        allowed: false,
        remaining: 0,
        resetTime,
      };
    } catch (error) {
      logger.error('Rate limiter check failed:', error);
      // Fail open - allow request if rate limiter fails
      return {
        allowed: true,
        remaining: maxRequests || this.maxRequests,
        resetTime: Date.now() + this.windowMs,
      };
    }
  }
}

// IP-based rate limiter middleware
export const ipRateLimitMiddleware = (maxRequests?: number, windowMs?: number) => {
  const limiter = new CustomRateLimiter(windowMs, maxRequests);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key = `rate_limit:ip:${req.ip}`;
      const result = await limiter.checkLimit(key, maxRequests);

      res.set({
        'X-RateLimit-Limit': maxRequests || MAX_REQUESTS,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      });

      if (!result.allowed) {
        logSecurityEvent('IP rate limit exceeded', 'medium', {
          ip: req.ip,
          url: req.originalUrl,
          method: req.method,
          resetTime: new Date(result.resetTime).toISOString(),
        });

        return res.status(429).json({
          success: false,
          error: {
            message: 'Too many requests from this IP, please try again later.',
            statusCode: 429,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          },
        });
      }

      next();
    } catch (error) {
      logger.error('IP rate limit middleware error:', error);
      next();
    }
  };
};

// User-based rate limiter middleware (requires authentication)
export const userRateLimitMiddleware = (maxRequests?: number, windowMs?: number) => {
  const limiter = new CustomRateLimiter(windowMs, maxRequests);

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return next();
      }

      const key = `rate_limit:user:${userId}`;
      const result = await limiter.checkLimit(key, maxRequests);

      res.set({
        'X-RateLimit-Limit': maxRequests || MAX_REQUESTS,
        'X-RateLimit-Remaining': result.remaining,
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
      });

      if (!result.allowed) {
        logSecurityEvent('User rate limit exceeded', 'medium', {
          userId,
          ip: req.ip,
          url: req.originalUrl,
          method: req.method,
          resetTime: new Date(result.resetTime).toISOString(),
        });

        return res.status(429).json({
          success: false,
          error: {
            message: 'Too many requests, please try again later.',
            statusCode: 429,
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          },
        });
      }

      next();
    } catch (error) {
      logger.error('User rate limit middleware error:', error);
      next();
    }
  };
};

// Combined rate limiting middleware
export const rateLimitMiddleware = [
  generalLimiter,
  ipRateLimitMiddleware(),
];

// Export the custom rate limiter instance for use in other parts of the application
export const rateLimiter = new CustomRateLimiter();