import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(logColors);

// Create logs directory if it doesn't exist
import fs from 'fs';
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for console output
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = `\n${JSON.stringify(meta, null, 2)}`;
    }
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// Custom format for file output
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Daily rotate file transport
const dailyRotateTransport = new DailyRotateFile({
  filename: path.join(logsDir, 'navin-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '14d',
  format: fileFormat,
});

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  format: fileFormat,
  transports: [
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
    }),
    // Write all logs to combined log file
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
    }),
    // Daily rotate for application logs
    dailyRotateTransport,
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Create stream for Morgan HTTP logger
export const stream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export const logError = (error: Error, context?: any) => {
  logger.error(error.message, {
    stack: error.stack,
    context,
  });
};

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, meta);
};

export const logWarn = (message: string, meta?: any) => {
  logger.warn(message, meta);
};

export const logDebug = (message: string, meta?: any) => {
  logger.debug(message, meta);
};

export const logHttp = (message: string) => {
  logger.http(message);
};

// Performance logging helpers
export const logPerformance = (operation: string, duration: number, meta?: any) => {
  logger.info(`Performance: ${operation}`, {
    duration: `${duration}ms`,
    ...meta,
  });
};

// Database query logging
export const logDatabaseQuery = (query: string, duration: number, params?: any) => {
  logger.debug('Database Query', {
    query,
    duration: `${duration}ms`,
    params,
  });
};

// API request logging
export const logApiRequest = (method: string, url: string, statusCode: number, duration: number, ip?: string) => {
  logger.http('API Request', {
    method,
    url,
    statusCode,
    duration: `${duration}ms`,
    ip,
  });
};

// Authentication logging
export const logAuthEvent = (event: string, userId?: string, meta?: any) => {
  logger.info(`Auth Event: ${event}`, {
    userId,
    ...meta,
  });
};

// Security logging
export const logSecurityEvent = (event: string, severity: 'low' | 'medium' | 'high' | 'critical', meta?: any) => {
  logger.warn(`Security Event: ${event}`, {
    severity,
    ...meta,
  });
};

// Cache logging
export const logCacheEvent = (operation: string, key: string, hit: boolean, duration?: number) => {
  logger.debug('Cache Event', {
    operation,
    key,
    hit,
    duration: duration ? `${duration}ms` : undefined,
  });
};

export default logger;