import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get company by ID
router.get('/:id',
  param('id').isString(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const company = await prisma.company.findUnique({
        where: { id },
        include: {
          employees: {
            where: { leftAt: null },
            take: 10,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatar: true,
                  title: true
                }
              }
            }
          },
          jobs: {
            where: { isActive: true },
            take: 5,
            orderBy: { createdAt: 'desc' }
          },
          posts: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  avatar: true
                }
              }
            }
          },
          _count: {
            select: {
              followers: true,
              employees: { where: { leftAt: null } }
            }
          }
        }
      });

      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Check if user is following
      let isFollowing = false;
      let isAdmin = false;

      if (userId) {
        const follower = await prisma.companyFollower.findUnique({
          where: {
            userId_companyId: {
              userId,
              companyId: id
            }
          }
        });
        isFollowing = !!follower;

        // Check if user is admin
        const employee = await prisma.companyEmployee.findFirst({
          where: {
            userId,
            companyId: id,
            isAdmin: true,
            leftAt: null
          }
        });
        isAdmin = !!employee;
      }

      res.json({
        ...company,
        followerCount: company._count.followers,
        employeeCount: company._count.employees,
        isFollowing,
        isAdmin
      });
    } catch (error) {
      console.error('Error fetching company:', error);
      res.status(500).json({ error: 'Failed to fetch company' });
    }
  }
);

// Follow company
router.post('/:id/follow',
  param('id').isString(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const company = await prisma.company.findUnique({ where: { id } });
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      // Check if already following
      const existing = await prisma.companyFollower.findUnique({
        where: {
          userId_companyId: {
            userId,
            companyId: id
          }
        }
      });

      if (existing) {
        return res.status(400).json({ error: 'Already following this company' });
      }

      await prisma.companyFollower.create({
        data: {
          userId,
          companyId: id
        }
      });

      res.json({ message: 'Successfully followed company' });
    } catch (error) {
      console.error('Error following company:', error);
      res.status(500).json({ error: 'Failed to follow company' });
    }
  }
);

// Unfollow company
router.delete('/:id/follow',
  param('id').isString(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await prisma.companyFollower.delete({
        where: {
          userId_companyId: {
            userId,
            companyId: id
          }
        }
      });

      res.json({ message: 'Successfully unfollowed company' });
    } catch (error) {
      console.error('Error unfollowing company:', error);
      res.status(500).json({ error: 'Failed to unfollow company' });
    }
  }
);

// Get company followers
router.get('/:id/followers',
  param('id').isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      const followers = await prisma.companyFollower.findMany({
        where: { companyId: id },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              title: true,
              company: true
            }
          }
        }
      });

      res.json(followers);
    } catch (error) {
      console.error('Error fetching followers:', error);
      res.status(500).json({ error: 'Failed to fetch followers' });
    }
  }
);

// Submit company insight/review
router.post('/:id/insights',
  param('id').isString(),
  body('type').isIn(['CULTURE', 'WORK_LIFE_BALANCE', 'GROWTH', 'MANAGEMENT']),
  body('rating').isFloat({ min: 1, max: 5 }),
  body('review').optional().isString(),
  body('pros').optional().isString(),
  body('cons').optional().isString(),
  body('position').optional().isString(),
  body('employmentType').optional().isIn(['CURRENT', 'FORMER']),
  body('isAnonymous').isBoolean(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const insightData = req.body;

      const company = await prisma.company.findUnique({ where: { id } });
      if (!company) {
        return res.status(404).json({ error: 'Company not found' });
      }

      const insight = await prisma.companyInsight.create({
        data: {
          companyId: id,
          userId,
          ...insightData
        }
      });

      res.status(201).json(insight);
    } catch (error) {
      console.error('Error creating insight:', error);
      res.status(500).json({ error: 'Failed to create insight' });
    }
  }
);

// Get company insights
router.get('/:id/insights',
  param('id').isString(),
  query('type').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { type, limit = 20 } = req.query;

      const where: any = { companyId: id };
      if (type) {
        where.type = type;
      }

      const insights = await prisma.companyInsight.findMany({
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

      // Hide user info for anonymous reviews
      const sanitized = insights.map(insight => {
        if (insight.isAnonymous) {
          return { ...insight, user: null, userId: null };
        }
        return insight;
      });

      res.json(sanitized);
    } catch (error) {
      console.error('Error fetching insights:', error);
      res.status(500).json({ error: 'Failed to fetch insights' });
    }
  }
);

// Get company statistics
router.get('/:id/stats',
  param('id').isString(),
  async (req, res) => {
    try {
      const { id } = req.params;

      const [
        followerCount,
        employeeCount,
        activeJobs,
        avgRating,
        insightCount
      ] = await Promise.all([
        prisma.companyFollower.count({ where: { companyId: id } }),
        prisma.companyEmployee.count({ where: { companyId: id, leftAt: null } }),
        prisma.job.count({ where: { companyId: id, isActive: true } }),
        prisma.companyInsight.aggregate({
          where: { companyId: id },
          _avg: { rating: true }
        }),
        prisma.companyInsight.count({ where: { companyId: id } })
      ]);

      res.json({
        followerCount,
        employeeCount,
        activeJobs,
        avgRating: avgRating._avg.rating || 0,
        insightCount
      });
    } catch (error) {
      console.error('Error fetching company stats:', error);
      res.status(500).json({ error: 'Failed to fetch statistics' });
    }
  }
);

// Search companies
router.get('/',
  query('search').optional().isString(),
  query('industry').optional().isString(),
  query('size').optional().isString(),
  query('location').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res) => {
    try {
      const { search, industry, size, location, limit = 20 } = req.query;

      const where: any = {};

      if (search) {
        where.name = { contains: search as string, mode: 'insensitive' };
      }
      if (industry) {
        where.industry = { contains: industry as string, mode: 'insensitive' };
      }
      if (size) {
        where.size = size as string;
      }
      if (location) {
        where.location = { contains: location as string, mode: 'insensitive' };
      }

      const companies = await prisma.company.findMany({
        where,
        take: parseInt(limit as string),
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              followers: true,
              employees: { where: { leftAt: null } }
            }
          }
        }
      });

      res.json(companies);
    } catch (error) {
      console.error('Error searching companies:', error);
      res.status(500).json({ error: 'Failed to search companies' });
    }
  }
);

export default router;
