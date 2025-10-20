import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { logger, logAuthEvent } from '../utils/logger';
import { authLimiter } from '../middleware/rateLimit';
import { addNotificationJob } from '../services/queue';

const router = Router();

// Validation rules
const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('username').optional().trim().isLength({ min: 3, max: 30 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

const forgotPasswordValidation = [
  body('email').isEmail().normalizeEmail(),
];

const resetPasswordValidation = [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
];

// Register new user
router.post('/signup', authLimiter, registerValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array(),
          statusCode: 400,
        },
      });
    }

    const { email, password, name, username, bio, title, company, location } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ].filter(Boolean),
      },
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'username';
      return res.status(409).json({
        success: false,
        error: {
          message: `${field} already exists`,
          statusCode: 409,
        },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        username,
        bio,
        title,
        company,
        location,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        bio: true,
        title: true,
        company: true,
        location: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Create welcome notification
    await addNotificationJob({
      userId: user.id,
      type: 'WELCOME',
      title: 'Welcome to NavIN!',
      message: 'Thank you for joining our professional network. Complete your profile to connect with others.',
      data: { userId: user.id },
    });

    logAuthEvent('User Registered', user.id, { email: user.email });

    res.status(201).json({
      success: true,
      data: {
        user,
        message: 'Account created successfully! Please check your email for verification.',
      },
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Registration failed',
        statusCode: 500,
      },
    });
  }
});

// Login user
router.post('/login', authLimiter, loginValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array(),
          statusCode: 400,
        },
      });
    }

    const { email, password, rememberMe } = req.body;

    // Find user with profile data
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        username: true,
        bio: true,
        title: true,
        company: true,
        location: true,
        avatar: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
      },
    });

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password',
          statusCode: 401,
        },
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Account has been deactivated',
          statusCode: 401,
        },
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      logAuthEvent('Failed Login Attempt', user.id, { email: user.email });
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password',
          statusCode: 401,
        },
      });
    }

    // Check email verification if required
    if (process.env.REQUIRE_EMAIL_VERIFICATION === 'true' && !user.emailVerified) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Please verify your email address before logging in',
          statusCode: 401,
          code: 'EMAIL_NOT_VERIFIED',
        },
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate access token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    // Generate refresh token if remember me is true
    let refreshToken = null;
    if (rememberMe) {
      refreshToken = jwt.sign(
        tokenPayload,
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' } as jwt.SignOptions
      );
    }

    logAuthEvent('User Login Successful', user.id, { email: user.email });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          bio: user.bio,
          title: user.title,
          company: user.company,
          location: user.location,
          avatar: user.avatar,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        token,
        refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        message: 'Login successful',
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Login failed',
        statusCode: 500,
      },
    });
  }
});

// Get current user profile
router.get('/me', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          statusCode: 401,
        },
      });
    }

    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        bio: true,
        title: true,
        company: true,
        location: true,
        website: true,
        avatar: true,
        skills: true,
        socialLinks: true,
        role: true,
        isActive: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        // Include counts
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          statusCode: 404,
        },
      });
    }

    res.json({
      success: true,
      data: { user: userProfile },
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get profile',
        statusCode: 500,
      },
    });
  }
});

// Update user profile
router.put('/me', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required',
          statusCode: 401,
        },
      });
    }

    const { name, username, bio, title, company, location, website, skills, socialLinks } = req.body;

    // Check if username is being changed and if it's already taken
    if (username && username !== user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: {
            message: 'Username already exists',
            statusCode: 409,
          },
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        name,
        username,
        bio,
        title,
        company,
        location,
        website,
        skills,
        socialLinks,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        bio: true,
        title: true,
        company: true,
        location: true,
        website: true,
        avatar: true,
        skills: true,
        socialLinks: true,
        updatedAt: true,
      },
    });

    logAuthEvent('Profile Updated', user.id);

    res.json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update profile',
        statusCode: 500,
      },
    });
  }
});

// Forgot password
router.post('/forgot-password', authLimiter, forgotPasswordValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array(),
          statusCode: 400,
        },
      });
    }

    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true },
    });

    if (user) {
      // Generate password reset token
      const resetToken = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' } as jwt.SignOptions
      );

      // TODO: Send email with reset token
      // await sendPasswordResetEmail(user.email, resetToken);

      logAuthEvent('Password Reset Requested', user.id, { email: user.email });
    }

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    logger.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to process request',
        statusCode: 500,
      },
    });
  }
});

// Reset password
router.post('/reset-password', resetPasswordValidation, async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Validation failed',
          details: errors.array(),
          statusCode: 400,
        },
      });
    }

    const { token, password } = req.body;

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid or expired reset token',
          statusCode: 401,
        },
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    await prisma.user.update({
      where: { id: decoded.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    logAuthEvent('Password Reset Successful', decoded.id);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to reset password',
        statusCode: 500,
      },
    });
  }
});

// Refresh token
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Refresh token required',
          statusCode: 401,
        },
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid refresh token',
          statusCode: 401,
        },
      });
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid user',
          statusCode: 401,
        },
      });
    }

    // Generate new access token
    const newToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    res.json({
      success: true,
      data: {
        token: newToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      },
    });
  } catch (error) {
    logger.error('Token refresh error:', error);
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid refresh token',
        statusCode: 401,
      },
    });
  }
});

// Logout (client-side should remove token)
router.post('/logout', (req: Request, res: Response) => {
  const user = (req as any).user;

  if (user) {
    logAuthEvent('User Logout', user.id);
  }

  res.json({
    success: true,
    message: 'Logout successful',
  });
});

// Verify email
router.post('/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Verification token required',
          statusCode: 400,
        },
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid verification token',
          statusCode: 401,
        },
      });
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: decoded.id },
      data: {
        emailVerified: new Date(),
        updatedAt: new Date(),
      },
    });

    logAuthEvent('Email Verified', decoded.id);

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(401).json({
      success: false,
      error: {
        message: 'Invalid or expired verification token',
        statusCode: 401,
      },
    });
  }
});

export default router;