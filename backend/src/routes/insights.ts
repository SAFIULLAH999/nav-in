import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// ============== SALARY INSIGHTS ==============

// Submit salary insight
router.post('/salary',
  body('jobTitle').isString().notEmpty(),
  body('company').optional().isString(),
  body('companySize').optional().isString(),
  body('location').isString().notEmpty(),
  body('salaryMin').isInt({ min: 0 }),
  body('salaryMax').isInt({ min: 0 }),
  body('currency').optional().isString(),
  body('employment').optional().isString(),
  body('experience').isString().notEmpty(),
  body('industry').optional().isString(),
  body('benefits').optional().isString(),
  body('isAnonymous').isBoolean(),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const insightData = req.body;

      if (insightData.salaryMin > insightData.salaryMax) {
        return res.status(400).json({ error: 'Minimum salary cannot exceed maximum salary' });
      }

      const insight = await prisma.salaryInsight.create({
        data: {
          userId,
          ...insightData
        }
      });

      res.status(201).json(insight);
    } catch (error) {
      console.error('Error creating salary insight:', error);
      res.status(500).json({ error: 'Failed to create salary insight' });
    }
  }
);

// Get salary insights with filters
router.get('/salary',
  query('jobTitle').optional().isString(),
  query('company').optional().isString(),
  query('location').optional().isString(),
  query('experience').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res) => {
    try {
      const { jobTitle, company, location, experience, limit = 50 } = req.query;

      const where: any = {};
      
      if (jobTitle) {
        where.jobTitle = { contains: jobTitle as string, mode: 'insensitive' };
      }
      if (company) {
        where.company = { contains: company as string, mode: 'insensitive' };
      }
      if (location) {
        where.location = { contains: location as string, mode: 'insensitive' };
      }
      if (experience) {
        where.experience = experience as string;
      }

      const insights = await prisma.salaryInsight.findMany({
        where,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      // Hide user info if anonymous
      const sanitized = insights.map(insight => {
        if (insight.isAnonymous) {
          return {
            ...insight,
            user: null,
            userId: null
          };
        }
        return insight;
      });

      res.json(sanitized);
    } catch (error) {
      console.error('Error fetching salary insights:', error);
      res.status(500).json({ error: 'Failed to fetch salary insights' });
    }
  }
);

// Get salary statistics
router.get('/salary/stats',
  query('jobTitle').isString().notEmpty(),
  query('location').optional().isString(),
  async (req, res) => {
    try {
      const { jobTitle, location } = req.query;

      const where: any = {
        jobTitle: { contains: jobTitle as string, mode: 'insensitive' }
      };

      if (location) {
        where.location = { contains: location as string, mode: 'insensitive' };
      }

      const insights = await prisma.salaryInsight.findMany({ where });

      if (insights.length === 0) {
        return res.json({
          count: 0,
          avgMin: 0,
          avgMax: 0,
          medianMin: 0,
          medianMax: 0
        });
      }

      const avgMin = insights.reduce((sum, i) => sum + i.salaryMin, 0) / insights.length;
      const avgMax = insights.reduce((sum, i) => sum + i.salaryMax, 0) / insights.length;

      const sortedMins = insights.map(i => i.salaryMin).sort((a, b) => a - b);
      const sortedMaxs = insights.map(i => i.salaryMax).sort((a, b) => a - b);
      const medianMin = sortedMins[Math.floor(sortedMins.length / 2)];
      const medianMax = sortedMaxs[Math.floor(sortedMaxs.length / 2)];

      res.json({
        count: insights.length,
        avgMin: Math.round(avgMin),
        avgMax: Math.round(avgMax),
        medianMin,
        medianMax
      });
    } catch (error) {
      console.error('Error calculating salary stats:', error);
      res.status(500).json({ error: 'Failed to calculate statistics' });
    }
  }
);

// Vote on salary insight
router.post('/salary/:id/vote',
  param('id').isString(),
  body('vote').isIn(['upvote', 'downvote']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { vote } = req.body;

      const insight = await prisma.salaryInsight.findUnique({
        where: { id }
      });

      if (!insight) {
        return res.status(404).json({ error: 'Insight not found' });
      }

      const updated = await prisma.salaryInsight.update({
        where: { id },
        data: {
          upvotes: vote === 'upvote' ? insight.upvotes + 1 : insight.upvotes,
          downvotes: vote === 'downvote' ? insight.downvotes + 1 : insight.downvotes
        }
      });

      res.json(updated);
    } catch (error) {
      console.error('Error voting on salary insight:', error);
      res.status(500).json({ error: 'Failed to vote' });
    }
  }
);

// ============== INTERVIEW EXPERIENCES ==============

// Submit interview experience
router.post('/interview',
  body('company').isString().notEmpty(),
  body('jobTitle').isString().notEmpty(),
  body('location').optional().isString(),
  body('interviewType').isString().notEmpty(),
  body('difficulty').isIn(['EASY', 'MEDIUM', 'HARD']),
  body('outcome').isString().notEmpty(),
  body('experience').isString().notEmpty(),
  body('questions').optional().isString(),
  body('process').optional().isString(),
  body('duration').optional().isString(),
  body('tips').optional().isString(),
  body('isAnonymous').isBoolean(),
  body('interviewDate').optional().isISO8601(),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const experienceData = req.body;

      const experience = await prisma.interviewExperience.create({
        data: {
          userId,
          ...experienceData
        }
      });

      res.status(201).json(experience);
    } catch (error) {
      console.error('Error creating interview experience:', error);
      res.status(500).json({ error: 'Failed to create interview experience' });
    }
  }
);

// Get interview experiences with filters
router.get('/interview',
  query('company').optional().isString(),
  query('jobTitle').optional().isString(),
  query('difficulty').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res) => {
    try {
      const { company, jobTitle, difficulty, limit = 50 } = req.query;

      const where: any = {};
      
      if (company) {
        where.company = { contains: company as string, mode: 'insensitive' };
      }
      if (jobTitle) {
        where.jobTitle = { contains: jobTitle as string, mode: 'insensitive' };
      }
      if (difficulty) {
        where.difficulty = difficulty as string;
      }

      const experiences = await prisma.interviewExperience.findMany({
        where,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true
            }
          }
        }
      });

      // Hide user info if anonymous
      const sanitized = experiences.map(exp => {
        if (exp.isAnonymous) {
          return {
            ...exp,
            user: null,
            userId: null
          };
        }
        return exp;
      });

      res.json(sanitized);
    } catch (error) {
      console.error('Error fetching interview experiences:', error);
      res.status(500).json({ error: 'Failed to fetch interview experiences' });
    }
  }
);

// Mark interview experience as helpful
router.post('/interview/:id/helpful',
  param('id').isString(),
  body('helpful').isBoolean(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { helpful } = req.body;

      const experience = await prisma.interviewExperience.findUnique({
        where: { id }
      });

      if (!experience) {
        return res.status(404).json({ error: 'Experience not found' });
      }

      const updated = await prisma.interviewExperience.update({
        where: { id },
        data: {
          helpful: helpful ? experience.helpful + 1 : experience.helpful,
          notHelpful: !helpful ? experience.notHelpful + 1 : experience.notHelpful
        }
      });

      res.json(updated);
    } catch (error) {
      console.error('Error marking interview experience:', error);
      res.status(500).json({ error: 'Failed to mark as helpful' });
    }
  }
);

// Get interview statistics for a company
router.get('/interview/stats/:company',
  param('company').isString(),
  async (req, res) => {
    try {
      const { company } = req.params;

      const experiences = await prisma.interviewExperience.findMany({
        where: {
          company: { contains: company, mode: 'insensitive' }
        }
      });

      if (experiences.length === 0) {
        return res.json({
          count: 0,
          difficultyBreakdown: {},
          outcomeBreakdown: {},
          avgDifficulty: 0
        });
      }

      const difficultyBreakdown = experiences.reduce((acc: any, exp) => {
        acc[exp.difficulty] = (acc[exp.difficulty] || 0) + 1;
        return acc;
      }, {});

      const outcomeBreakdown = experiences.reduce((acc: any, exp) => {
        acc[exp.outcome] = (acc[exp.outcome] || 0) + 1;
        return acc;
      }, {});

      res.json({
        count: experiences.length,
        difficultyBreakdown,
        outcomeBreakdown
      });
    } catch (error) {
      console.error('Error calculating interview stats:', error);
      res.status(500).json({ error: 'Failed to calculate statistics' });
    }
  }
);

export default router;
