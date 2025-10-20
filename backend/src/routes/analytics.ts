import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { logger } from '../utils/logger';

const router = Router();

// Get analytics data
router.get('/', async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    const jobCount = await prisma.job.count();

    res.json({
      success: true,
      data: {
        analytics: {
          users: userCount,
          posts: postCount,
          jobs: jobCount,
        },
      },
    });
  } catch (error) {
    logger.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get analytics',
        statusCode: 500,
      },
    });
  }
});

export default router;