import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import * as Sentry from '@sentry/nextjs'

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
}

// Define colors for different log levels
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
}

winston.addColors(colors)

// Create the logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}`,
    ),
  ),
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxSize: '20m',
      maxFiles: '14d',
    }),

    // Write all logs with importance level of `info` or less to `combined.log`
    new DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
})

// If we're not in production then also log to the console
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }))
}

// Create HTTP request logger middleware
export const httpLogger = winston.createLogger({
  level: 'http',
  levels,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: 'logs/http-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxSize: '20m',
      maxFiles: '7d',
    }),
  ],
})

// Structured logging functions
export class Logger {
  static info(message: string, meta?: any) {
    logger.info(message, meta)
  }

  static warn(message: string, meta?: any) {
    logger.warn(message, meta)
  }

  static error(message: string, error?: Error, meta?: any) {
    const errorInfo = {
      message: error?.message,
      stack: error?.stack,
      ...meta
    }

    logger.error(message, errorInfo)

    // Send to Sentry if it's a critical error
    if (error && this.isCriticalError(error)) {
      Sentry.captureException(error, {
        tags: {
          message,
          ...meta
        }
      })
    }
  }

  static debug(message: string, meta?: any) {
    logger.debug(message, meta)
  }

  static http(message: string, meta?: any) {
    httpLogger.http(message, meta)
  }

  private static isCriticalError(error: Error): boolean {
    const criticalErrors = [
      'database connection failed',
      'authentication failed',
      'payment processing failed',
      'security breach detected'
    ]

    return criticalErrors.some(critical =>
      error.message.toLowerCase().includes(critical)
    )
  }
}

// Request tracing middleware
export function withRequestTracing(handler: Function) {
  return async (req: any, res: any, ...args: any[]) => {
    const startTime = Date.now()
    const requestId = generateRequestId()
    const userAgent = req.headers['user-agent'] || ''
    const ip = getClientIP(req)

    // Add request ID to response headers for tracing
    res.setHeader('X-Request-ID', requestId)

    Logger.http('Request started', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent,
      ip,
      timestamp: new Date().toISOString()
    })

    try {
      const result = await handler(req, res, ...args)
      const duration = Date.now() - startTime

      Logger.http('Request completed', {
        requestId,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      })

      return result
    } catch (error) {
      const duration = Date.now() - startTime

      Logger.error('Request failed', error as Error, {
        requestId,
        method: req.method,
        url: req.url,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      })

      throw error
    }
  }
}

// Generate unique request ID for tracing
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Get client IP address
function getClientIP(req: any): string {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  )
}

// Database operation logging
export class DatabaseLogger {
  static logQuery(operation: string, model: string, duration: number, meta?: any) {
    Logger.debug(`Database ${operation}`, {
      model,
      duration: `${duration}ms`,
      ...meta
    })
  }

  static logError(operation: string, model: string, error: Error, meta?: any) {
    Logger.error(`Database ${operation} failed`, error, {
      model,
      ...meta
    })
  }
}

// Authentication logging
export class AuthLogger {
  static logLogin(userId: string, method: string, success: boolean, meta?: any) {
    const level = success ? 'info' : 'warn'
    Logger[level]('User authentication', {
      userId,
      method,
      success,
      event: 'login',
      ...meta
    })
  }

  static logLogout(userId: string, meta?: any) {
    Logger.info('User logout', {
      userId,
      event: 'logout',
      ...meta
    })
  }

  static logTokenRefresh(userId: string, success: boolean, meta?: any) {
    Logger.info('Token refresh', {
      userId,
      success,
      event: 'token_refresh',
      ...meta
    })
  }

  static logPasswordReset(userId: string, success: boolean, meta?: any) {
    Logger.info('Password reset', {
      userId,
      success,
      event: 'password_reset',
      ...meta
    })
  }
}

// Business logic logging
export class BusinessLogger {
  static logUserRegistration(userId: string, email: string, meta?: any) {
    Logger.info('User registration', {
      userId,
      email,
      event: 'user_registered',
      ...meta
    })
  }

  static logProfileUpdate(userId: string, fields: string[], meta?: any) {
    Logger.info('Profile update', {
      userId,
      fields,
      event: 'profile_updated',
      ...meta
    })
  }

  static logJobPosting(userId: string, jobId: string, meta?: any) {
    Logger.info('Job posting', {
      userId,
      jobId,
      event: 'job_posted',
      ...meta
    })
  }

  static logJobApplication(userId: string, jobId: string, meta?: any) {
    Logger.info('Job application', {
      userId,
      jobId,
      event: 'job_applied',
      ...meta
    })
  }

  static logConnectionRequest(senderId: string, receiverId: string, meta?: any) {
    Logger.info('Connection request', {
      senderId,
      receiverId,
      event: 'connection_requested',
      ...meta
    })
  }

  static logMessageSent(senderId: string, receiverId: string, messageId: string, meta?: any) {
    Logger.info('Message sent', {
      senderId,
      receiverId,
      messageId,
      event: 'message_sent',
      ...meta
    })
  }
}

// Security logging
export class SecurityLogger {
  static logSuspiciousActivity(userId: string, activity: string, details: any) {
    Logger.warn('Suspicious activity detected', {
      userId,
      activity,
      details,
      event: 'security_suspicious_activity'
    })

    // Send to Sentry for immediate attention
    Sentry.captureMessage(`Suspicious activity: ${activity}`, {
      level: 'warning',
      tags: {
        userId,
        activity
      },
      extra: details
    })
  }

  static logRateLimitExceeded(key: string, limit: number, windowMs: number) {
    Logger.warn('Rate limit exceeded', {
      key,
      limit,
      windowMs,
      event: 'rate_limit_exceeded'
    })
  }

  static logFailedLogin(email: string, ip: string, reason: string) {
    Logger.warn('Failed login attempt', {
      email,
      ip,
      reason,
      event: 'failed_login'
    })
  }

  static logAccountLocked(userId: string, reason: string) {
    Logger.error('Account locked', new Error('Account security lock'), {
      userId,
      reason,
      event: 'account_locked'
    })
  }
}

// Performance monitoring
export class PerformanceLogger {
  static startTimer(operation: string): () => void {
    const startTime = Date.now()

    return () => {
      const duration = Date.now() - startTime
      Logger.debug(`Operation completed`, {
        operation,
        duration: `${duration}ms`,
        event: 'performance_timer'
      })
    }
  }

  static logSlowQuery(query: string, duration: number, threshold: number = 1000) {
    if (duration > threshold) {
      Logger.warn('Slow query detected', {
        query: query.substring(0, 100), // Truncate long queries
        duration: `${duration}ms`,
        threshold: `${threshold}ms`,
        event: 'slow_query'
      })
    }
  }

  static logMemoryUsage() {
    const usage = process.memoryUsage()
    Logger.debug('Memory usage', {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`,
      event: 'memory_usage'
    })
  }
}

// Export default logger for backward compatibility
export default logger
