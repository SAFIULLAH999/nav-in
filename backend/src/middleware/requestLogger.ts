import { Request, Response, NextFunction } from 'express';
import { logger, logApiRequest, logSecurityEvent } from '../utils/logger';

// Extend Request interface to include timing
interface TimedRequest extends Request {
  startTime?: number;
}

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  (req as TimedRequest).startTime = startTime;

  // Log incoming request
  logger.http('Incoming Request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method !== 'GET' ? req.body : undefined,
    params: req.params,
    query: req.query,
  });

  // Log response when it's finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const contentLength = res.get('Content-Length');

    logApiRequest(req.method, req.originalUrl, statusCode, duration, req.ip);

    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow Request Detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        statusCode,
        ip: req.ip,
      });
    }

    // Log potential security issues
    if (statusCode === 404) {
      logSecurityEvent('Not Found Request', 'low', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    if (statusCode === 401 || statusCode === 403) {
      logSecurityEvent('Unauthorized Access Attempt', 'medium', {
        method: req.method,
        url: req.originalUrl,
        statusCode,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
    }

    if (statusCode >= 500) {
      logger.error('Server Error Response', {
        method: req.method,
        url: req.originalUrl,
        statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        error: res.locals.error || 'Unknown error',
      });
    }
  });

  next();
};

// Request timing middleware
export const requestTimer = (req: Request, res: Response, next: NextFunction) => {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    // Add timing header
    res.setHeader('X-Response-Time', `${duration.toFixed(2)}ms`);
  });

  next();
};

// Request ID middleware for tracking
let requestIdCounter = 0;
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (++requestIdCounter % 1000000).toString().padStart(6, '0');
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  next();
};

// CORS preflight handler
export const corsHandler = (req: Request, res: Response, next: NextFunction) => {
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    return res.status(200).end();
  }

  next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions policy (formerly Feature Policy)
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
};

// Request validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /(\.\.|\/\*|\*\/)/, // Path traversal attempts
    /<script[^>]*>.*?<\/script>/gi, // Script injection attempts
    /(union|select|insert|update|delete|drop|create|alter)/gi, // SQL injection attempts
  ];

  const url = req.originalUrl;
  const body = JSON.stringify(req.body);
  const query = JSON.stringify(req.query);

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url) || pattern.test(body) || pattern.test(query)) {
      logSecurityEvent('Suspicious Request Pattern', 'high', {
        pattern: pattern.source,
        url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });

      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid request format',
          statusCode: 400,
        },
      });
    }
  }

  next();
};

// Body size validation middleware
export const validateBodySize = (req: Request, res: Response, next: NextFunction) => {
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB default

  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    logSecurityEvent('Request Too Large', 'medium', {
      size: req.headers['content-length'],
      maxSize,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });

    return res.status(413).json({
      success: false,
      error: {
        message: 'Request body too large',
        statusCode: 413,
      },
    });
  }

  next();
};

// API versioning middleware
export const apiVersion = (req: Request, res: Response, next: NextFunction) => {
  const apiPrefix = process.env.API_PREFIX || '/api/v1';
  const requestPath = req.path;

  if (requestPath.startsWith(apiPrefix)) {
    const version = apiPrefix.split('/').pop() || 'v1';
    req.headers['api-version'] = version;
    res.setHeader('API-Version', version);
  }

  next();
};

// Maintenance mode middleware
export const maintenanceMode = (req: Request, res: Response, next: NextFunction) => {
  // Skip health checks during maintenance
  if (req.originalUrl === '/health') {
    return next();
  }

  // Check if maintenance mode is enabled
  const maintenance = process.env.MAINTENANCE_MODE === 'true';

  if (maintenance) {
    return res.status(503).json({
      success: false,
      error: {
        message: 'Service temporarily unavailable for maintenance',
        statusCode: 503,
        retryAfter: process.env.MAINTENANCE_RETRY_AFTER || '3600', // 1 hour default
      },
    });
  }

  next();
};