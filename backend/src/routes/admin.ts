import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get admin dashboard data
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    const jobCount = await prisma.job.count();
    const messageCount = await prisma.message.count();

    res.json({
      success: true,
      data: {
        dashboard: {
          users: userCount,
          posts: postCount,
          jobs: jobCount,
          messages: messageCount,
        },
      },
    });
  } catch (error) {
    logger.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get dashboard data',
        statusCode: 500,
      },
    });
  }
});

export default router;