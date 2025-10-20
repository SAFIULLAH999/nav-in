import { Request, Response, NextFunction } from 'express';
import { logger, logError } from '../utils/logger';
import { Prisma } from '@prisma/client';

// Custom error interface
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  errors?: any[];
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: any;
    stack?: string;
  };
}

// Prisma error handler
const handlePrismaError = (error: Prisma.PrismaClientKnownRequestError): AppError => {
  switch (error.code) {
    case 'P2002':
      return {
        name: 'ValidationError',
        message: 'Unique constraint violation',
        statusCode: 409,
        isOperational: true,
        errors: [{
          field: error.meta?.target as string,
          message: `${error.meta?.target} already exists`,
        }],
      };

    case 'P2025':
      return {
        name: 'NotFoundError',
        message: 'Record not found',
        statusCode: 404,
        isOperational: true,
      };

    case 'P2003':
      return {
        name: 'ValidationError',
        message: 'Foreign key constraint failed',
        statusCode: 400,
        isOperational: true,
      };

    case 'P2014':
      return {
        name: 'ValidationError',
        message: 'Invalid ID format',
        statusCode: 400,
        isOperational: true,
      };

    default:
      return {
        name: 'DatabaseError',
        message: 'Database operation failed',
        statusCode: 500,
        isOperational: false,
      };
  }
};

// JWT error handler
const handleJWTError = (): AppError => ({
  name: 'AuthenticationError',
  message: 'Invalid token',
  statusCode: 401,
  isOperational: true,
});

// Validation error handler
const handleValidationError = (error: any): AppError => ({
  name: 'ValidationError',
  message: 'Validation failed',
  statusCode: 400,
  isOperational: true,
  errors: error.errors || [{
    field: error.field || 'unknown',
    message: error.message || 'Invalid input',
  }],
});

// Cast error handler (for invalid ObjectId)
const handleCastError = (error: any): AppError => ({
  name: 'ValidationError',
  message: 'Invalid ID format',
  statusCode: 400,
  isOperational: true,
  errors: [{
    field: error.path,
    message: `${error.value} is not a valid ID`,
  }],
});

// Main error handler middleware
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): Response<ErrorResponse> => {
  let appError: AppError = { ...error };
  appError.message = error.message;

  // Log error
  logError(error, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Handle specific error types
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    appError = handlePrismaError(error);
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    appError = handleJWTError();
  } else if (error.name === 'ValidationError' || error.name === 'CastError') {
    appError = handleValidationError(error);
  } else if (error.name === 'CastError') {
    appError = handleCastError(error);
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors || {}).map((val: any) => ({
      field: val.path,
      message: val.message,
    }));
    appError = {
      name: 'ValidationError',
      message: 'Validation failed',
      statusCode: 400,
      isOperational: true,
      errors,
    };
  }

  // Mongoose duplicate key error
  if ((error as any).code === 11000) {
    const field = Object.keys((error as any).keyValue || {})[0];
    appError = {
      name: 'ValidationError',
      message: `${field} already exists`,
      statusCode: 409,
      isOperational: true,
      errors: [{
        field,
        message: `${field} already exists`,
      }],
    };
  }

  // Set default values
  appError.statusCode = appError.statusCode || 500;
  appError.isOperational = appError.isOperational !== false;

  // Send error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      message: appError.message,
      statusCode: appError.statusCode,
      ...(appError.errors && { details: appError.errors }),
      ...(process.env.NODE_ENV === 'development' && { stack: appError.stack }),
    },
  };

  return res.status(appError.statusCode).json(errorResponse);
};

// 404 handler middleware
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): Response => {
  const error: AppError = {
    name: 'NotFoundError',
    message: `Route ${req.originalUrl} not found`,
    statusCode: 404,
    isOperational: true,
  };

  return errorHandler(error, req, res, next);
};

// Async error wrapper
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Development error sender (for debugging)
export const sendErrorDev = (error: AppError, res: Response): Response => {
  return res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message,
      statusCode: error.statusCode,
      stack: error.stack,
      errors: error.errors,
    },
  });
};

// Production error sender
export const sendErrorProd = (error: AppError, res: Response): Response => {
  // Operational, trusted error: send message to client
  if (error.isOperational) {
    return res.status(error.statusCode || 500).json({
      success: false,
      error: {
        message: error.message,
        statusCode: error.statusCode,
        ...(error.errors && { details: error.errors }),
      },
    });
  }

  // Programming or other unknown error: don't leak error details
  return res.status(500).json({
    success: false,
    error: {
      message: 'Something went wrong!',
      statusCode: 500,
    },
  });
};