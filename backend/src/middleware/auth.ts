import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';
import { logger, logAuthEvent, logSecurityEvent } from '../utils/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        isActive: boolean;
        emailVerified?: boolean;
        twoFactorEnabled?: boolean;
      };
    }
  }
}

// JWT verification middleware
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logSecurityEvent('Missing Authentication Token', 'medium', {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
        userAgent: req.get('User-Agent'),
      });

      return res.status(401).json({
        success: false,
        error: {
          message: 'Access token required',
          statusCode: 401,
        },
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!decoded || !decoded.id) {
      logSecurityEvent('Invalid Token Format', 'medium', {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
      });

      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token format',
          statusCode: 401,
        },
      });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        twoFactorEnabled: true,
      },
    });

    if (!user) {
      logSecurityEvent('User Not Found for Valid Token', 'high', {
        userId: decoded.id,
        ip: req.ip,
        url: req.originalUrl,
      });

      return res.status(401).json({
        success: false,
        error: {
          message: 'User not found',
          statusCode: 401,
        },
      });
    }

    if (!user.isActive) {
      logSecurityEvent('Inactive User Access Attempt', 'high', {
        userId: user.id,
        email: user.email,
        ip: req.ip,
        url: req.originalUrl,
      });

      return res.status(401).json({
        success: false,
        error: {
          message: 'Account is deactivated',
          statusCode: 401,
        },
      });
    }

    // Check if email verification is required
    if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.emailVerified) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Email verification required',
          statusCode: 401,
          code: 'EMAIL_NOT_VERIFIED',
        },
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified ? true : false,
      twoFactorEnabled: user.twoFactorEnabled || false,
    };

    logAuthEvent('Token Authentication Successful', user.id, {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
    });

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      logSecurityEvent('Expired Token Used', 'medium', {
        ip: req.ip,
        url: req.originalUrl,
        exp: error.exp,
      });

      return res.status(401).json({
        success: false,
        error: {
          message: 'Token has expired',
          statusCode: 401,
          code: 'TOKEN_EXPIRED',
        },
      });
    }

    if (error.name === 'JsonWebTokenError') {
      logSecurityEvent('Invalid Token Signature', 'medium', {
        ip: req.ip,
        url: req.originalUrl,
        error: error.message,
      });

      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token',
          statusCode: 401,
          code: 'INVALID_TOKEN',
        },
      });
    }

    logger.error('Token authentication error:', error);
    logSecurityEvent('Token Authentication Error', 'medium', {
      error: error.message,
      ip: req.ip,
      url: req.originalUrl,
    });

    res.status(500).json({
      success: false,
      error: {
        message: 'Authentication failed',
        statusCode: 500,
      },
    });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (decoded && decoded.id) {
      const user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
          emailVerified: true,
          twoFactorEnabled: true,
        },
      });

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          emailVerified: user.emailVerified ? true : false,
          twoFactorEnabled: user.twoFactorEnabled || false,
        };
      }
    }
  } catch (error) {
    // Ignore errors in optional auth
    logger.debug('Optional auth failed:', error);
  }

  next();
};

// Role-based authorization middleware
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          statusCode: 401,
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      logSecurityEvent('Unauthorized Role Access', 'medium', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: roles,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
      });

      return res.status(403).json({
        success: false,
        error: {
          message: 'Insufficient permissions',
          statusCode: 403,
        },
      });
    }

    next();
  };
};

// Admin-only authorization middleware
export const requireAdmin = authorize('ADMIN', 'SUPER_ADMIN');

// Moderator authorization middleware
export const requireModerator = authorize('ADMIN', 'MODERATOR');

// Email verification requirement middleware
export const requireEmailVerification = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
        statusCode: 401,
      },
    });
  }

  if (!req.user.emailVerified) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Email verification required',
        statusCode: 401,
        code: 'EMAIL_NOT_VERIFIED',
      },
    });
  }

  next();
};

// Two-factor authentication requirement middleware
export const requireTwoFactor = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
        statusCode: 401,
      },
    });
  }

  if (req.user.twoFactorEnabled) {
    // Check if 2FA token is provided in headers
    const twoFactorToken = req.headers['x-2fa-token'];

    if (!twoFactorToken) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Two-factor authentication required',
          statusCode: 401,
          code: '2FA_REQUIRED',
        },
      });
    }

    // TODO: Implement 2FA token verification
    // For now, we'll just check if the token exists
    if (twoFactorToken.length < 6) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid two-factor token',
          statusCode: 401,
          code: 'INVALID_2FA_TOKEN',
        },
      });
    }
  }

  next();
};

// Account ownership verification middleware
export const requireOwnership = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          statusCode: 401,
        },
      });
    }

    const requestedUserId = req.params[userIdParam];
    const currentUserId = req.user.id;

    // Allow admins and moderators to access any account
    if (req.user.role === 'ADMIN' || req.user.role === 'MODERATOR') {
      return next();
    }

    // Check if user is accessing their own account
    if (requestedUserId !== currentUserId) {
      logSecurityEvent('Unauthorized Account Access', 'medium', {
        userId: currentUserId,
        requestedUserId,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
      });

      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied: can only access own account',
          statusCode: 403,
        },
      });
    }

    next();
  };
};

// API key authentication middleware (for external services)
export const authenticateApiKey = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'API key required',
          statusCode: 401,
        },
      });
    }

    // TODO: Implement API key verification against database
    // For now, we'll just check if it matches a configured key
    const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

    if (!validApiKeys.includes(apiKey as string)) {
      logSecurityEvent('Invalid API Key Used', 'medium', {
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
      });

      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid API key',
          statusCode: 401,
        },
      });
    }

    next();
  } catch (error) {
    logger.error('API key authentication error:', error);

    res.status(500).json({
      success: false,
      error: {
        message: 'Authentication failed',
        statusCode: 500,
      },
    });
  }
};

// Session-based authentication middleware (alternative to JWT)
// Note: This requires express-session middleware to be configured
export const authenticateSession = (req: Request, res: Response, next: NextFunction) => {
  // Type assertion for session property (requires express-session types)
  const session = (req as any).session;

  if (session && session.userId) {
    req.user = {
      id: session.userId,
      email: session.email || '',
      role: session.role || 'USER',
      isActive: session.isActive !== false,
    };
  }

  next();
};

// Combined authentication middleware (tries multiple methods)
export const flexibleAuth = [
  optionalAuth, // This will try to authenticate but won't fail if no token
];

// Export commonly used middleware combinations
export const authMiddleware = {
  required: authenticateToken,
  optional: optionalAuth,
  admin: [authenticateToken, requireAdmin],
  moderator: [authenticateToken, requireModerator],
  ownership: (param: string) => [authenticateToken, requireOwnership(param)],
  emailVerified: [authenticateToken, requireEmailVerification],
  twoFactor: [authenticateToken, requireTwoFactor],
  apiKey: authenticateApiKey,
  session: authenticateSession,
  flexible: flexibleAuth,
};