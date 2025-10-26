import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Middleware to check if user is moderator/admin
const requireModerator = (req: any, res: any, next: any) => {
  if (req.user.role !== 'ADMIN' && req.user.role !== 'MODERATOR') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

// ============== CONTENT REPORTS ==============

// Submit content report
router.post('/reports',
  body('contentType').isIn(['POST', 'COMMENT', 'ARTICLE', 'PROFILE', 'JOB']),
  body('contentId').isString().notEmpty(),
  body('reason').isIn(['SPAM', 'HARASSMENT', 'INAPPROPRIATE', 'MISINFORMATION', 'OTHER']),
  body('description').optional().isString(),
  async (req, res) => {
    try {
      const reporterId = req.user.id;
      const { contentType, contentId, reason, description } = req.body;

      // Check if user already reported this content
      const existing = await prisma.contentReport.findFirst({
        where: {
          reporterId,
          contentType,
          contentId
        }
      });

      if (existing) {
        return res.status(400).json({ error: 'You have already reported this content' });
      }

      const report = await prisma.contentReport.create({
        data: {
          reporterId,
          contentType,
          contentId,
          reason,
          description
        }
      });

      // TODO: Send notification to moderation team

      res.status(201).json(report);
    } catch (error) {
      console.error('Error creating content report:', error);
      res.status(500).json({ error: 'Failed to create report' });
    }
  }
);

// Get all reports (moderators only)
router.get('/reports',
  requireModerator,
  query('status').optional().isString(),
  query('contentType').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res) => {
    try {
      const { status, contentType, limit = 50 } = req.query;

      const where: any = {};
      
      if (status) {
        where.status = status as string;
      }
      if (contentType) {
        where.contentType = contentType as string;
      }

      const reports = await prisma.contentReport.findMany({
        where,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  }
);

// Get specific report
router.get('/reports/:id',
  requireModerator,
  param('id').isString(),
  async (req, res) => {
    try {
      const { id } = req.params;

      const report = await prisma.contentReport.findUnique({
        where: { id },
        include: {
          reporter: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      res.json(report);
    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({ error: 'Failed to fetch report' });
    }
  }
);

// Update report status
router.patch('/reports/:id',
  requireModerator,
  param('id').isString(),
  body('status').isIn(['PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED']),
  body('resolution').optional().isString(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, resolution } = req.body;
      const reviewerId = req.user.id;

      const report = await prisma.contentReport.update({
        where: { id },
        data: {
          status,
          resolution,
          reviewerId,
          reviewedAt: new Date()
        }
      });

      res.json(report);
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({ error: 'Failed to update report' });
    }
  }
);

// ============== MODERATION ACTIONS ==============

// Create moderation action
router.post('/actions',
  requireModerator,
  body('targetType').isIn(['USER', 'POST', 'COMMENT', 'ARTICLE']),
  body('targetId').isString().notEmpty(),
  body('action').isIn(['WARN', 'HIDE', 'DELETE', 'SUSPEND', 'BAN']),
  body('reason').isString().notEmpty(),
  body('notes').optional().isString(),
  body('duration').optional().isInt({ min: 1 }),
  async (req, res) => {
    try {
      const moderatorId = req.user.id;
      const { targetType, targetId, action, reason, notes, duration } = req.body;

      const moderationAction = await prisma.moderationAction.create({
        data: {
          moderatorId,
          targetType,
          targetId,
          action,
          reason,
          notes,
          duration
        }
      });

      // Apply the moderation action
      switch (action) {
        case 'HIDE':
        case 'DELETE':
          // Implement logic to hide/delete content
          break;
        case 'SUSPEND':
        case 'BAN':
          // Implement logic to suspend/ban user
          if (targetType === 'USER') {
            await prisma.user.update({
              where: { id: targetId },
              data: { isActive: action === 'BAN' ? false : true }
            });
          }
          break;
      }

      // TODO: Send notification to target user

      res.status(201).json(moderationAction);
    } catch (error) {
      console.error('Error creating moderation action:', error);
      res.status(500).json({ error: 'Failed to create moderation action' });
    }
  }
);

// Get moderation actions
router.get('/actions',
  requireModerator,
  query('targetType').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res) => {
    try {
      const { targetType, limit = 50 } = req.query;

      const where: any = {};
      
      if (targetType) {
        where.targetType = targetType as string;
      }

      const actions = await prisma.moderationAction.findMany({
        where,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          moderator: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      res.json(actions);
    } catch (error) {
      console.error('Error fetching moderation actions:', error);
      res.status(500).json({ error: 'Failed to fetch actions' });
    }
  }
);

// Get moderation statistics
router.get('/stats',
  requireModerator,
  async (req, res) => {
    try {
      const [
        pendingReports,
        reviewingReports,
        totalActions,
        activeBans
      ] = await Promise.all([
        prisma.contentReport.count({ where: { status: 'PENDING' } }),
        prisma.contentReport.count({ where: { status: 'REVIEWING' } }),
        prisma.moderationAction.count(),
        prisma.moderationAction.count({
          where: {
            action: 'BAN',
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
            }
          }
        })
      ]);

      res.json({
        pendingReports,
        reviewingReports,
        totalActions,
        activeBans
      });
    } catch (error) {
      console.error('Error fetching moderation stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
);

export default router;
