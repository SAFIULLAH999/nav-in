import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all users (admin only)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { users },
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get users',
        statusCode: 500,
      },
    });
  }
});

// Get user by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
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
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
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
      data: { user },
    });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get user',
        statusCode: 500,
      },
    });
  }
});

// PATCH /profile/open-to - Update open-to status
router.patch('/profile/open-to', authenticateToken,
  body('type').isIn(['WORK', 'HIRING', 'FREELANCE', 'MENTORSHIP', 'COLLABORATION']).notEmpty(),
  body('message').optional().isString().trim().isLength({ max: 100 }),
  body('visibility').isIn(['PUBLIC', 'CONNECTIONS_ONLY', 'PRIVATE']),
  body('expiresAfterDays').optional().isInt({ min: 1, max: 365 }),
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            statusCode: 400,
            details: errors.array(),
          },
        });
      }

      const userId = (req as any).user.id;
      const { type, message, visibility, expiresAfterDays } = req.body;

      // Calculate expiration date
      let expiresAt = null;
      if (expiresAfterDays) {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + expiresAfterDays);
        expiresAt = expireDate;
      }

      // Create or update OpenTo record
      const openTo = await prisma.openTo.upsert({
        where: {
          userId_type: {
            userId,
            type,
          },
        },
        update: {
          message,
          visibility,
          expiresAt,
          isActive: true,
          updatedAt: new Date(),
        },
        create: {
          userId,
          type,
          message,
          visibility,
          expiresAt,
          isActive: true,
        },
      });

      // Update User model's currentOpenToType for quick access
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { currentOpenToType: type },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          title: true,
          currentOpenToType: true,
        },
      });

      res.status(200).json({
        success: true,
        data: {
          openTo,
          user: updatedUser,
        },
        message: `${type} status set successfully`,
      });
    } catch (error) {
      logger.error('Update open-to error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to update open-to status',
          statusCode: 500,
        },
      });
    }
  }
);

// DELETE /profile/open-to/:type - Clear open-to status
router.delete('/profile/open-to/:type', authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { type } = req.params;

      // Check if type is valid
      if (!['WORK', 'HIRING', 'FREELANCE', 'MENTORSHIP', 'COLLABORATION'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid open-to type',
            statusCode: 400,
          },
        });
      }

      // Deactivate OpenTo record
      await prisma.openTo.update({
        where: {
          userId_type: {
            userId,
            type,
          },
        },
        data: {
          isActive: false,
        },
      });

      // Check if there are other active open-to statuses
      const activeOpenTo = await prisma.openTo.findFirst({
        where: {
          userId,
          isActive: true,
        },
      });

      // Update User's currentOpenToType
      await prisma.user.update({
        where: { id: userId },
        data: {
          currentOpenToType: activeOpenTo?.type || null,
        },
      });

      res.status(200).json({
        success: true,
        message: `${type} status cleared`,
      });
    } catch (error) {
      logger.error('Clear open-to error:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to clear open-to status',
          statusCode: 500,
        },
      });
    }
  }
);

export default router;