import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });

  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.originalUrl} not found`,
      statusCode: 404,
    },
  });
};