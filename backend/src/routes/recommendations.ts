import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Request a recommendation
router.post('/request',
  body('recommenderId').isString().notEmpty(),
  body('relationship').isString().notEmpty(),
  body('position').optional().isString(),
  body('message').optional().isString(),
  async (req, res) => {
    try {
      const { recommenderId, relationship, position, message } = req.body;
      const requesterId = req.user.id; // From auth middleware

      // Check if already requested
      const existing = await prisma.recommendation.findFirst({
        where: {
          requesterId,
          recommenderId,
          status: { in: ['PENDING', 'ACCEPTED'] }
        }
      });

      if (existing) {
        return res.status(400).json({ error: 'Recommendation already requested or exists' });
      }

      const recommendation = await prisma.recommendation.create({
        data: {
          requesterId,
          recommenderId,
          relationship,
          position,
          content: '', // Empty until recommender fills it
        }
      });

      // TODO: Send notification to recommender

      res.status(201).json(recommendation);
    } catch (error) {
      console.error('Error requesting recommendation:', error);
      res.status(500).json({ error: 'Failed to request recommendation' });
    }
  }
);

// Respond to recommendation request
router.put('/:id/respond',
  param('id').isString(),
  body('content').isString().notEmpty(),
  body('status').isIn(['ACCEPTED', 'DECLINED']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { content, status } = req.body;
      const userId = req.user.id;

      const recommendation = await prisma.recommendation.findUnique({
        where: { id }
      });

      if (!recommendation) {
        return res.status(404).json({ error: 'Recommendation not found' });
      }

      if (recommendation.recommenderId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const updated = await prisma.recommendation.update({
        where: { id },
        data: {
          content: status === 'ACCEPTED' ? content : '',
          status,
          respondedAt: new Date()
        }
      });

      // TODO: Send notification to requester

      res.json(updated);
    } catch (error) {
      console.error('Error responding to recommendation:', error);
      res.status(500).json({ error: 'Failed to respond to recommendation' });
    }
  }
);

// Get user's recommendations (received)
router.get('/received',
  query('status').optional().isString(),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const recommendations = await prisma.recommendation.findMany({
        where: {
          requesterId: userId,
          ...(status ? { status: status as string } : {}),
          isVisible: true
        },
        include: {
          recommender: {
            select: {
              id: true,
              name: true,
              title: true,
              avatar: true,
              company: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(recommendations);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      res.status(500).json({ error: 'Failed to fetch recommendations' });
    }
  }
);

// Get recommendation requests (to give)
router.get('/requests',
  query('status').optional().isString(),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { status } = req.query;

      const requests = await prisma.recommendation.findMany({
        where: {
          recommenderId: userId,
          ...(status ? { status: status as string } : {})
        },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              title: true,
              avatar: true,
              company: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json(requests);
    } catch (error) {
      console.error('Error fetching recommendation requests:', error);
      res.status(500).json({ error: 'Failed to fetch recommendation requests' });
    }
  }
);

// Update recommendation visibility
router.patch('/:id/visibility',
  param('id').isString(),
  body('isVisible').isBoolean(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { isVisible } = req.body;
      const userId = req.user.id;

      const recommendation = await prisma.recommendation.findUnique({
        where: { id }
      });

      if (!recommendation || recommendation.requesterId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      const updated = await prisma.recommendation.update({
        where: { id },
        data: { isVisible }
      });

      res.json(updated);
    } catch (error) {
      console.error('Error updating recommendation visibility:', error);
      res.status(500).json({ error: 'Failed to update visibility' });
    }
  }
);

// Delete recommendation
router.delete('/:id',
  param('id').isString(),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const recommendation = await prisma.recommendation.findUnique({
        where: { id }
      });

      if (!recommendation) {
        return res.status(404).json({ error: 'Recommendation not found' });
      }

      // Only requester can delete
      if (recommendation.requesterId !== userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }

      await prisma.recommendation.delete({
        where: { id }
      });

      res.json({ message: 'Recommendation deleted successfully' });
    } catch (error) {
      console.error('Error deleting recommendation:', error);
      res.status(500).json({ error: 'Failed to delete recommendation' });
    }
  }
);

export default router;
