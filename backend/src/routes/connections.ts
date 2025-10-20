import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { logger, logAuthEvent } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { addNotificationJob } from '../services/queue';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Validation rules
const connectionRequestValidation = [
  body('targetUserId').isUUID().withMessage('Invalid target user ID'),
];

// Get all connections for current user
router.get('/', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;

    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId },
        ],
        status: 'ACCEPTED',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            company: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            company: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform the data to show the other user in each connection
    const transformedConnections = connections.map(connection => {
      const isSender = connection.senderId === currentUserId;
      const otherUser = isSender ? connection.receiver : connection.sender;

      return {
        id: connection.id,
        status: connection.status,
        createdAt: connection.createdAt,
        user: otherUser,
      };
    });

    res.json({
      success: true,
      data: { connections: transformedConnections },
    });
  } catch (error) {
    logger.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get connections',
        statusCode: 500,
      },
    });
  }
});

// Get pending connection requests (received)
router.get('/requests', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;

    const requests = await prisma.connection.findMany({
      where: {
        receiverId: currentUserId,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            company: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { requests },
    });
  } catch (error) {
    logger.error('Get connection requests error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get connection requests',
        statusCode: 500,
      },
    });
  }
});

// Get sent connection requests
router.get('/sent', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;

    const sentRequests = await prisma.connection.findMany({
      where: {
        senderId: currentUserId,
        status: 'PENDING',
      },
      include: {
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            company: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: { requests: sentRequests },
    });
  } catch (error) {
    logger.error('Get sent requests error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get sent requests',
        statusCode: 500,
      },
    });
  }
});

// Send connection request
router.post('/request', connectionRequestValidation, async (req: Request, res: Response) => {
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
    const { targetUserId } = req.body;

    // Prevent self-connection
    if (currentUserId === targetUserId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot connect to yourself',
          statusCode: 400,
        },
      });
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true, isActive: true },
    });

    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found or inactive',
          statusCode: 404,
        },
      });
    }

    // Check if connection already exists
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: currentUserId },
        ],
      },
    });

    if (existingConnection) {
      if (existingConnection.status === 'ACCEPTED') {
        return res.status(409).json({
          success: false,
          error: {
            message: 'Users are already connected',
            statusCode: 409,
          },
        });
      } else if (existingConnection.status === 'PENDING') {
        return res.status(409).json({
          success: false,
          error: {
            message: 'Connection request already exists',
            statusCode: 409,
          },
        });
      }
    }

    // Create connection request
    const connection = await prisma.connection.create({
      data: {
        senderId: currentUserId,
        receiverId: targetUserId,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Send notification to target user
    await addNotificationJob({
      userId: targetUserId,
      type: 'CONNECTION_REQUEST',
      title: 'New Connection Request',
      message: `${(req as any).user.name} wants to connect with you`,
      data: {
        connectionId: connection.id,
        requesterId: currentUserId,
        requesterName: (req as any).user.name,
      },
    });

    logAuthEvent('Connection Request Sent', currentUserId, {
      targetUserId,
      targetUserName: targetUser.name,
    });

    res.status(201).json({
      success: true,
      data: { connection },
      message: 'Connection request sent successfully',
    });
  } catch (error) {
    logger.error('Send connection request error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send connection request',
        statusCode: 500,
      },
    });
  }
});

// Accept connection request
router.put('/:connectionId/accept', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { connectionId } = req.params;

    // Find the connection request
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Connection request not found',
          statusCode: 404,
        },
      });
    }

    if (connection.receiverId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to accept this request',
          statusCode: 403,
        },
      });
    }

    if (connection.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Connection request is not pending',
          statusCode: 400,
        },
      });
    }

    // Update connection status
    const updatedConnection = await prisma.connection.update({
      where: { id: connectionId },
      data: { status: 'ACCEPTED' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Send notification to requester
    await addNotificationJob({
      userId: connection.senderId,
      type: 'CONNECTION_ACCEPTED',
      title: 'Connection Request Accepted',
      message: `${(req as any).user.name} accepted your connection request`,
      data: {
        connectionId: connection.id,
        accepterId: currentUserId,
        accepterName: (req as any).user.name,
      },
    });

    logAuthEvent('Connection Request Accepted', currentUserId, {
      requesterId: connection.senderId,
      requesterName: connection.sender.name,
    });

    res.json({
      success: true,
      data: { connection: updatedConnection },
      message: 'Connection request accepted successfully',
    });
  } catch (error) {
    logger.error('Accept connection error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to accept connection request',
        statusCode: 500,
      },
    });
  }
});

// Reject connection request
router.put('/:connectionId/reject', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { connectionId } = req.params;

    // Find the connection request
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Connection request not found',
          statusCode: 404,
        },
      });
    }

    if (connection.receiverId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to reject this request',
          statusCode: 403,
        },
      });
    }

    if (connection.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Connection request is not pending',
          statusCode: 400,
        },
      });
    }

    // Delete the connection request
    await prisma.connection.delete({
      where: { id: connectionId },
    });

    logAuthEvent('Connection Request Rejected', currentUserId, {
      requesterId: connection.senderId,
      requesterName: connection.sender.name,
    });

    res.json({
      success: true,
      message: 'Connection request rejected successfully',
    });
  } catch (error) {
    logger.error('Reject connection error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to reject connection request',
        statusCode: 500,
      },
    });
  }
});

// Remove connection
router.delete('/:connectionId', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { connectionId } = req.params;

    // Find the connection
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      select: {
        id: true,
        followerId: true,
        followingId: true,
        follower: { select: { name: true } },
        following: { select: { name: true } },
      },
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Connection not found',
          statusCode: 404,
        },
      });
    }

    // Check if user is part of this connection
    if (connection.senderId !== currentUserId && connection.receiverId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to remove this connection',
          statusCode: 403,
        },
      });
    }

    // Delete the connection
    await prisma.connection.delete({
      where: { id: connectionId },
    });

    // Get the other user's name
    const otherUser = await prisma.user.findUnique({
      where: {
        id: connection.senderId === currentUserId
          ? connection.receiverId
          : connection.senderId
      },
      select: { name: true },
    });

    const otherUserName = otherUser?.name || 'Unknown User';

    logAuthEvent('Connection Removed', currentUserId, {
      otherUserId: connection.senderId === currentUserId
        ? connection.receiverId
        : connection.senderId,
      otherUserName,
    });

    res.json({
      success: true,
      message: 'Connection removed successfully',
    });
  } catch (error) {
    logger.error('Remove connection error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to remove connection',
        statusCode: 500,
      },
    });
  }
});

// Get connection suggestions
router.get('/suggestions', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 10;

    // Get users that are not already connected and not the current user
    const currentUserConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId },
        ],
        status: 'ACCEPTED',
      },
      select: {
        senderId: true,
        receiverId: true,
      },
    });

    const connectedUserIds = new Set([
      ...currentUserConnections.map(c => c.senderId),
      ...currentUserConnections.map(c => c.receiverId),
    ]);

    // Remove current user from connected users
    connectedUserIds.delete(currentUserId);

    // Get suggested users (users with similar profiles or mutual connections)
    const suggestions = await prisma.user.findMany({
      where: {
        id: {
          notIn: Array.from(connectedUserIds),
          not: currentUserId,
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        bio: true,
        title: true,
        company: true,
        location: true,
        avatar: true,
        skills: true,
        _count: {
          select: {
            sentConnections: true,
            receivedConnections: true,
          },
        },
      },
      take: limit,
      orderBy: [
        { receivedConnections: { _count: 'desc' } },
        { createdAt: 'desc' },
      ],
    });

    res.json({
      success: true,
      data: { suggestions },
    });
  } catch (error) {
    logger.error('Get connection suggestions error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get connection suggestions',
        statusCode: 500,
      },
    });
  }
});

export default router;