import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { logger, logAuthEvent } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// All notification routes require authentication
router.use(authenticateToken);

// Validation rules
const markAsReadValidation = [
  body('notificationIds').isArray({ min: 1 }).withMessage('notificationIds must be a non-empty array'),
  body('notificationIds.*').isUUID().withMessage('Invalid notification ID'),
];

const notificationSettingsValidation = [
  body('emailNotifications').optional().isBoolean(),
  body('pushNotifications').optional().isBoolean(),
  body('connectionRequests').optional().isBoolean(),
  body('jobApplications').optional().isBoolean(),
  body('postLikes').optional().isBoolean(),
  body('postComments').optional().isBoolean(),
  body('messages').optional().isBoolean(),
];

// Get all notifications for current user
router.get('/', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const type = req.query.type as string;
    const isRead = req.query.isRead as string;
    const offset = (page - 1) * limit;

    // Build filter conditions
    const whereConditions: any = { userId: currentUserId };

    if (type) {
      whereConditions.type = type;
    }

    if (isRead === 'true') {
      whereConditions.isRead = true;
    } else if (isRead === 'false') {
      whereConditions.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereConditions,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get total count for pagination
    const totalCount = await prisma.notification.count({ where: whereConditions });

    // Get unread count
    const unreadCount = await prisma.notification.count({
      where: { userId: currentUserId, isRead: false },
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: offset + notifications.length < totalCount,
        },
        unreadCount,
      },
    });
  } catch (error) {
    logger.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get notifications',
        statusCode: 500,
      },
    });
  }
});

// Get unread notifications count
router.get('/unread/count', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;

    const unreadCount = await prisma.notification.count({
      where: { userId: currentUserId, isRead: false },
    });

    res.json({
      success: true,
      data: { count: unreadCount },
    });
  } catch (error) {
    logger.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get unread count',
        statusCode: 500,
      },
    });
  }
});

// Mark notifications as read
router.put('/mark-read', markAsReadValidation, async (req: Request, res: Response) => {
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

    const currentUserId = (req as any).user.id;
    const { notificationIds } = req.body;

    // Update notifications to mark as read
    const result = await prisma.notification.updateMany({
      where: {
        id: { in: notificationIds },
        userId: currentUserId,
        isRead: false,
      },
      data: { isRead: true },
    });

    logAuthEvent('Notifications Marked as Read', currentUserId, {
      markedCount: result.count,
      notificationIds,
    });

    res.json({
      success: true,
      data: { markedCount: result.count },
      message: `${result.count} notifications marked as read`,
    });
  } catch (error) {
    logger.error('Mark notifications read error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to mark notifications as read',
        statusCode: 500,
      },
    });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;

    const result = await prisma.notification.updateMany({
      where: {
        userId: currentUserId,
        isRead: false,
      },
      data: { isRead: true },
    });

    logAuthEvent('All Notifications Marked as Read', currentUserId, {
      markedCount: result.count,
    });

    res.json({
      success: true,
      data: { markedCount: result.count },
      message: 'All notifications marked as read',
    });
  } catch (error) {
    logger.error('Mark all notifications read error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to mark all notifications as read',
        statusCode: 500,
      },
    });
  }
});

// Delete notification
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { id } = req.params;

    // Check if notification exists and belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id },
      select: { id: true, userId: true, type: true },
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Notification not found',
          statusCode: 404,
        },
      });
    }

    if (notification.userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to delete this notification',
          statusCode: 403,
        },
      });
    }

    await prisma.notification.delete({
      where: { id },
    });

    logAuthEvent('Notification Deleted', currentUserId, {
      notificationId: id,
      type: notification.type,
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    logger.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete notification',
        statusCode: 500,
      },
    });
  }
});

// Delete all notifications for current user
router.delete('/', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const type = req.query.type as string;

    const whereConditions: any = { userId: currentUserId };
    if (type) {
      whereConditions.type = type;
    }

    const result = await prisma.notification.deleteMany({
      where: whereConditions,
    });

    logAuthEvent('All Notifications Deleted', currentUserId, {
      deletedCount: result.count,
      type,
    });

    res.json({
      success: true,
      data: { deletedCount: result.count },
      message: `${result.count} notifications deleted`,
    });
  } catch (error) {
    logger.error('Delete all notifications error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete notifications',
        statusCode: 500,
      },
    });
  }
});

// Get notification types and their counts
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;

    const notifications = await prisma.notification.findMany({
      where: { userId: currentUserId },
      select: { type: true, isRead: true },
    });

    // Group by type and read status
    const summary = notifications.reduce((acc, notification) => {
      if (!acc[notification.type]) {
        acc[notification.type] = { total: 0, unread: 0 };
      }
      acc[notification.type].total += 1;
      if (!notification.isRead) {
        acc[notification.type].unread += 1;
      }
      return acc;
    }, {} as Record<string, { total: number; unread: number }>);

    res.json({
      success: true,
      data: { summary },
    });
  } catch (error) {
    logger.error('Get notification summary error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get notification summary',
        statusCode: 500,
      },
    });
  }
});

// Get notification settings (placeholder for future implementation)
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;

    // For now, return default settings
    // In the future, this could be stored in a separate table
    const settings = {
      emailNotifications: true,
      pushNotifications: true,
      connectionRequests: true,
      jobApplications: true,
      postLikes: true,
      postComments: true,
      messages: true,
    };

    res.json({
      success: true,
      data: { settings },
    });
  } catch (error) {
    logger.error('Get notification settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get notification settings',
        statusCode: 500,
      },
    });
  }
});

// Update notification settings (placeholder for future implementation)
router.put('/settings', notificationSettingsValidation, async (req: Request, res: Response) => {
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

    const currentUserId = (req as any).user.id;
    const settings = req.body;

    // For now, just log the settings update
    // In the future, this could be stored in a separate table
    logAuthEvent('Notification Settings Updated', currentUserId, { settings });

    res.json({
      success: true,
      data: { settings },
      message: 'Notification settings updated successfully',
    });
  } catch (error) {
    logger.error('Update notification settings error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update notification settings',
        statusCode: 500,
      },
    });
  }
});

export default router;