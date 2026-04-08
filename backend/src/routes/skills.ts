import { Router } from 'express';
import { param, query, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/v1/skills - List all skills with optional filtering
router.get('/',
  query('category').optional().isString(),
  query('search').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res) => {
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

      const category = req.query.category as string;
      const search = req.query.search as string;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      const where: any = {};
      if (category) where.category = category;
      if (search) where.name = { contains: search, mode: 'insensitive' };

      const skills = await prisma.skill.findMany({
        where,
        take: limit,
        orderBy: { name: 'asc' },
      });

      return res.status(200).json({
        success: true,
        data: { skills },
      });
    } catch (error) {
      logger.error('Error fetching skills:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch skills',
          statusCode: 500,
        },
      });
    }
  }
);

// GET /api/v1/skills/:skillId - Get skill details with leaderboard
router.get('/:skillId',
  param('skillId').isString().notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res) => {
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

      const { skillId } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      // Get skill
      const skill = await prisma.skill.findUnique({
        where: { id: skillId },
      });

      if (!skill) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Skill not found',
            statusCode: 404,
          },
        });
      }

      // Get top experts (leaderboard)
      const leaderboard = await prisma.endorsement.findMany({
        where: { skillId },
        include: {
          receiver: {
            select: {
              id: true,
              name: true,
              avatar: true,
              title: true,
              company: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      // Group by receiver and count endorsements
      const groupedByReceiver: Record<string, any> = {};
      leaderboard.forEach((endorsement) => {
        const receiverId = endorsement.receiverId;
        if (!groupedByReceiver[receiverId]) {
          groupedByReceiver[receiverId] = {
            ...endorsement.receiver,
            endorsementCount: 0,
            badges: [],
          };
        }
        groupedByReceiver[receiverId].endorsementCount += 1;
      });

      // Get badges for these users
      const userIds = Object.keys(groupedByReceiver);
      if (userIds.length > 0) {
        const badges = await prisma.verificationBadge.findMany({
          where: {
            userId: { in: userIds },
            type: 'SKILL_VERIFIED',
            isActive: true,
          },
        });

        badges.forEach((badge) => {
          if (groupedByReceiver[badge.userId]) {
            groupedByReceiver[badge.userId].badges.push(badge);
          }
        });
      }

      // Convert to array and rank
      const rankedLeaderboard = Object.values(groupedByReceiver)
        .sort((a: any, b: any) => b.endorsementCount - a.endorsementCount)
        .slice(0, limit)
        .map((user: any, index: number) => ({
          rank: index + 1,
          ...user,
        }));

      // Get quizzes for this skill
      const quizzes = await prisma.quiz.findMany({
        where: { skillId },
        select: {
          id: true,
          title: true,
          description: true,
          difficulty: true,
          timeLimit: true,
          passingScore: true,
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          skill,
          leaderboard: rankedLeaderboard,
          quizzes,
          endorsementCount: leaderboard.length,
        },
      });
    } catch (error) {
      logger.error('Error fetching skill details:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch skill details',
          statusCode: 500,
        },
      });
    }
  }
);

// GET /api/v1/skills/:skillId/leaderboard - Get ranked leaderboard for skill
router.get('/:skillId/leaderboard',
  param('skillId').isString().notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res) => {
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

      const { skillId } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      // Aggregate endorsements by receiver
      const leaderboard = await prisma.endorsement.groupBy({
        by: ['receiverId'],
        where: { skillId },
        _count: { id: true },
        orderBy: [{ _count: { id: 'desc' } }],
        take: limit,
      });

      // Enrich with user data
      const enrichedLeaderboard = await Promise.all(
        leaderboard.map(async (item, index) => {
          const user = await prisma.user.findUnique({
            where: { id: item.receiverId },
            select: {
              id: true,
              name: true,
              avatar: true,
              title: true,
              company: true,
            },
          });

          // Get verified badge for this skill
          const badge = await prisma.verificationBadge.findFirst({
            where: {
              userId: item.receiverId,
              type: 'SKILL_VERIFIED',
              isActive: true,
            },
          });

          // Get quiz attempt stats
          const quizStats = await prisma.quizAttempt.groupBy({
            by: ['userId'],
            where: {
              userId: item.receiverId,
              passed: true,
            },
            _count: { id: true },
          });

          return {
            rank: index + 1,
            userId: item.receiverId,
            user,
            endorsementCount: item._count.id,
            verified: !!badge,
            quizzesCompleted: quizStats[0]?._count.id || 0,
          };
        })
      );

      return res.status(200).json({
        success: true,
        data: {
          skillId,
          leaderboard: enrichedLeaderboard,
          total: enrichedLeaderboard.length,
        },
      });
    } catch (error) {
      logger.error('Error fetching leaderboard:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch leaderboard',
          statusCode: 500,
        },
      });
    }
  }
);

// GET /api/v1/skills/:skillId/user-rank - Get current user's rank for a skill
router.get('/:skillId/user-rank', authenticateToken,
  param('skillId').isString().notEmpty(),
  async (req, res) => {
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

      const { skillId } = req.params;
      const userId = (req as any).user.id;

      // Get user's endorsement count for this skill
      const endorsementCount = await prisma.endorsement.count({
        where: {
          receiverId: userId,
          skillId,
        },
      });

      // Get all users with more endorsements (to calculate rank)
      const usersWithMoreEndorsements = await prisma.endorsement.findMany({
        where: { skillId },
        distinct: ['receiverId'],
        select: { receiverId: true },
      });

      // Count endorsements per user and find rank
      const userEndorsementCounts: Record<string, number> = {};
      for (const endorsement of await prisma.endorsement.findMany({
        where: { skillId },
        select: { receiverId: true },
      })) {
        userEndorsementCounts[endorsement.receiverId] =
          (userEndorsementCounts[endorsement.receiverId] || 0) + 1;
      }

      const rank =
        Object.values(userEndorsementCounts).filter(
          (count) => count > endorsementCount
        ).length + 1;

      // Check if verified
      const verified = await prisma.verificationBadge.findFirst({
        where: {
          userId,
          type: 'SKILL_VERIFIED',
          isActive: true,
        },
      });

      return res.status(200).json({
        success: true,
        data: {
          rank,
          endorsementCount,
          verified: !!verified,
          totalUsers: Object.keys(userEndorsementCounts).length,
        },
      });
    } catch (error) {
      logger.error('Error fetching user rank:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch user rank',
          statusCode: 500,
        },
      });
    }
  }
);

export default router;
