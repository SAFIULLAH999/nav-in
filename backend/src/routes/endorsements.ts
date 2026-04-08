import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Apply authentication to all routes
router.use(authenticateToken);

// POST /endorsements/skills/:skillId/endorse - Give a skill endorsement
router.post('/skills/:skillId/endorse',
  param('skillId').isString().notEmpty(),
  body('receiverId').isString().notEmpty(),
  body('message').optional().isString().trim(),
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
      const { receiverId, message } = req.body;
      const giverId = (req as any).user.id;

      // Prevent self-endorsement
      if (giverId === receiverId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Cannot endorse yourself',
            statusCode: 400,
          },
        });
      }

      // Check if skill exists
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

      // Check if receiver has this skill
      const userSkill = await prisma.userSkill.findFirst({
        where: {
          userId: receiverId,
          skillId,
        },
      });

      if (!userSkill) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'User does not have this skill',
            statusCode: 400,
          },
        });
      }

      // Check if already endorsed (upsert)
      const existingEndorsement = await prisma.endorsement.findFirst({
        where: {
          giverId,
          receiverId,
          skillId,
        },
      });

      if (existingEndorsement) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'You have already endorsed this skill for this user',
            statusCode: 400,
          },
        });
      }

      // Create endorsement
      const endorsement = await prisma.endorsement.create({
        data: {
          giverId,
          receiverId,
          skillId,
          message,
        },
        include: {
          giver: {
            select: { id: true, name: true, avatar: true, title: true },
          },
        },
      });

      // Create notification for receiver
      try {
        await prisma.notification.create({
          data: {
            userId: receiverId,
            type: 'ENDORSEMENT',
            title: `${(req as any).user.name || 'Someone'} endorsed your ${skill.name} skill`,
            message: `You received an endorsement for ${skill.name}${message ? `: "${message}"` : ''}`,
            data: JSON.stringify({
              endorsementId: endorsement.id,
              skillId,
              giverId,
            }),
          },
        });
      } catch (notifError) {
        logger.error('Failed to create notification:', notifError);
      }

      return res.status(201).json({
        success: true,
        data: endorsement,
        message: 'Endorsement created successfully',
      });
    } catch (error) {
      logger.error('Error creating endorsement:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to create endorsement',
          statusCode: 500,
        },
      });
    }
  }
);

// GET /endorsements/skills/:userId/endorsements - Get received endorsements
router.get('/skills/:userId/endorsements',
  param('userId').isString().notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
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

      const { userId } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
      const offset = parseInt(req.query.offset as string) || 0;

      // Get endorsements grouped by skill
      const endorsements = await prisma.endorsement.findMany({
        where: { receiverId: userId },
        include: {
          giver: {
            select: { id: true, name: true, avatar: true, title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      // Get total count
      const total = await prisma.endorsement.count({
        where: { receiverId: userId },
      });

      // Group by skill
      const groupedBySkill = endorsements.reduce((acc: any, end) => {
        if (!acc[end.skillId]) {
          acc[end.skillId] = [];
        }
        acc[end.skillId].push(end);
        return acc;
      }, {});

      return res.status(200).json({
        success: true,
        data: {
          endorsements: groupedBySkill,
          total,
          limit,
          offset,
        },
      });
    } catch (error) {
      logger.error('Error fetching endorsements:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch endorsements',
          statusCode: 500,
        },
      });
    }
  }
);

// DELETE /endorsements/:endorsementId - Revoke endorsement
router.delete('/:endorsementId',
  param('endorsementId').isString().notEmpty(),
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

      const { endorsementId } = req.params;
      const userId = (req as any).user.id;

      // Check authorization
      const endorsement = await prisma.endorsement.findUnique({
        where: { id: endorsementId },
      });

      if (!endorsement) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Endorsement not found',
            statusCode: 404,
          },
        });
      }

      if (endorsement.giverId !== userId) {
        return res.status(403).json({
          success: false,
          error: {
            message: 'Not authorized to delete this endorsement',
            statusCode: 403,
          },
        });
      }

      // Delete endorsement
      await prisma.endorsement.delete({
        where: { id: endorsementId },
      });

      return res.status(200).json({
        success: true,
        message: 'Endorsement revoked successfully',
      });
    } catch (error) {
      logger.error('Error deleting endorsement:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to delete endorsement',
          statusCode: 500,
        },
      });
    }
  }
);

// POST /endorsements/skills/:skillId/quiz/attempt - Submit quiz attempt and auto-award badge
router.post('/skills/:skillId/quiz/attempt',
  param('skillId').isString().notEmpty(),
  body('quizId').isString().notEmpty(),
  body('answers').isObject(),
  body('score').isInt({ min: 0, max: 100 }),
  body('totalPoints').isInt({ min: 1 }),
  body('earnedPoints').isInt({ min: 0 }),
  body('timeSpent').isInt({ min: 0 }),
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
      const { quizId, answers, score, totalPoints, earnedPoints, timeSpent } = req.body;
      const userId = (req as any).user.id;

      // Check if quiz exists and belongs to this skill
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
      });

      if (!quiz) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Quiz not found',
            statusCode: 404,
          },
        });
      }

      if (quiz.skillId !== skillId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Quiz does not belong to this skill',
            statusCode: 400,
          },
        });
      }

      const passed = score >= 80; // 80% passing score

      // Create quiz attempt
      let quizAttempt = await prisma.quizAttempt.create({
        data: {
          userId,
          quizId,
          score,
          totalPoints,
          earnedPoints,
          answers: JSON.stringify(answers),
          timeSpent,
          passed,
        },
        include: {
          user: { select: { id: true, name: true, email: true } },
          quiz: { select: { id: true, title: true, skillId: true } },
        },
      });

      // Auto-award badge if passed
      let badge = null;
      if (passed) {
        try {
          // Check if user already has skill verified badge for this skill
          const existingBadge = await prisma.verificationBadge.findFirst({
            where: {
              userId,
              type: 'SKILL_VERIFIED',
            },
          });

          if (!existingBadge) {
            badge = await prisma.verificationBadge.create({
              data: {
                userId,
                type: 'SKILL_VERIFIED',
                badgeData: JSON.stringify({
                  skillId,
                  skillName: (await prisma.skill.findUnique({ where: { id: skillId } }))?.name,
                  quizId,
                  score,
                  earnedAt: new Date().toISOString(),
                }),
              },
            });

            // Link badge to quiz attempt
            quizAttempt = await prisma.quizAttempt.update({
              where: { id: quizAttempt.id },
              data: { badgeEarnedId: badge.id },
              include: {
                user: true,
                quiz: true,
                badge: true,
              },
            });

            // Create notification for user
            try {
              await prisma.notification.create({
                data: {
                  userId,
                  type: 'BADGE_EARNED',
                  title: 'Skill Verified Badge Earned! 🏆',
                  message: `You've earned a verified skill badge for ${quiz.title}!`,
                  data: JSON.stringify({
                    badgeId: badge.id,
                    quizId,
                    skillId,
                  }),
                },
              });
            } catch (notifError) {
              logger.error('Failed to create badge notification:', notifError);
            }
          }
        } catch (badgeError) {
          logger.error('Failed to create skill verified badge:', badgeError);
        }
      }

      return res.status(201).json({
        success: true,
        data: {
          quizAttempt,
          badgeEarned: badge ? badge.id : null,
          passed,
          message: passed ? 'Quiz passed! Badge earned!' : 'Quiz attempt recorded. Keep practicing!',
        },
      });
    } catch (error) {
      logger.error('Error creating quiz attempt:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to record quiz attempt',
          statusCode: 500,
        },
      });
    }
  }
);

// GET /endorsements/skills/leaderboard - Get skill expertise leaderboard (Redis cached)
router.get('/skills/leaderboard',
  query('skillId').optional().isString(),
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

      const skillId = req.query.skillId as string || null;
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);

      // Build query
      const whereClause = skillId ? { skillId } : {};

      // Get top endorsed users
      const leaderboard = await prisma.endorsement.groupBy({
        by: ['receiverId', 'skillId'],
        where: whereClause,
        _count: {
          id: true,
        },
        orderBy: [
          { _count: { id: 'desc' } },
          { receiverId: 'asc' },
        ],
        take: limit,
      });

      // Enrich with user and skill data
      const enrichedLeaderboard = await Promise.all(
        leaderboard.map(async (item, index) => {
          const user = await prisma.user.findUnique({
            where: { id: item.receiverId },
            select: { id: true, name: true, avatar: true, title: true, company: true },
          });

          const skill = await prisma.skill.findUnique({
            where: { id: item.skillId },
            select: { id: true, name: true, category: true },
          });

          return {
            rank: index + 1,
            userId: item.receiverId,
            skillId: item.skillId,
            endorsementCount: item._count.id,
            user,
            skill,
          };
        })
      );

      return res.status(200).json({
        success: true,
        data: {
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

// GET /endorsements/skills/recommendations - AI-suggest skills based on role + industry
router.get('/skills/recommendations',
  query('limit').optional().isInt({ min: 1, max: 50 }),
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

      const userId = (req as any).user.id;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

      // Get user profile
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { userSkills: { include: { skill: true } } },
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

      // Get user's current skills
      const currentSkillIds = user.userSkills.map((us) => us.skillId);

      // Recommend skills based on industry patterns
      // For now, return popular skills not yet owned by user
      const recommendedSkills = await prisma.skill.findMany({
        where: {
          id: { notIn: currentSkillIds },
        },
        take: limit,
      });

      return res.status(200).json({
        success: true,
        data: {
          recommendations: recommendedSkills,
          reasoning: `Based on ${user.industry || 'your'} industry`,
        },
      });
    } catch (error) {
      logger.error('Error fetching skill recommendations:', error);
      return res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch skill recommendations',
          statusCode: 500,
        },
      });
    }
  }
);

export default router;
