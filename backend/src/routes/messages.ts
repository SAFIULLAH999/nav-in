import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { logger, logAuthEvent } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { addNotificationJob } from '../services/queue';

const router = Router();

// All message routes require authentication
router.use(authenticateToken);

// Validation rules
const sendMessageValidation = [
  body('content').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be between 1 and 1000 characters'),
  body('receiverId').isUUID().withMessage('Invalid receiver ID'),
];

const createThreadValidation = [
  body('participants').isArray({ min: 2 }).withMessage('Thread must have at least 2 participants'),
  body('participants.*').isUUID().withMessage('Invalid participant ID'),
  body('subject').optional().trim().isLength({ min: 1, max: 200 }),
];

// Get all conversations for current user
router.get('/', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get all direct messages involving the current user
    const directMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId },
          { receiverId: currentUserId },
        ],
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
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Group messages by conversation (other participant)
    const conversations = new Map();

    directMessages.forEach(message => {
      const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
      const otherUser = message.senderId === currentUserId ? message.receiver : message.sender;

      if (!conversations.has(otherUserId)) {
        conversations.set(otherUserId, {
          id: otherUserId,
          user: otherUser,
          lastMessage: message,
          unreadCount: message.receiverId === currentUserId && !message.isRead ? 1 : 0,
          updatedAt: message.createdAt,
        });
      } else {
        const conversation = conversations.get(otherUserId);
        if (message.createdAt > conversation.lastMessage.createdAt) {
          conversation.lastMessage = message;
        }
        if (message.receiverId === currentUserId && !message.isRead) {
          conversation.unreadCount += 1;
        }
        conversation.updatedAt = message.createdAt;
      }
    });

    // Convert map to array and sort by last activity
    const sortedConversations = Array.from(conversations.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    res.json({
      success: true,
      data: {
        conversations: sortedConversations,
        pagination: {
          page,
          limit,
          hasMore: directMessages.length === limit,
        },
      },
    });
  } catch (error) {
    logger.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get conversations',
        statusCode: 500,
      },
    });
  }
});

// Get conversation with specific user
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, avatar: true, isActive: true },
    });

    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'User not found',
          statusCode: 404,
        },
      });
    }

    // Get messages between current user and target user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUserId, receiverId: userId },
          { senderId: userId, receiverId: currentUserId },
        ],
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
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: currentUserId,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({
      success: true,
      data: {
        messages,
        participants: {
          current: (req as any).user,
          other: targetUser,
        },
        pagination: {
          page,
          limit,
          hasMore: messages.length === limit,
        },
      },
    });
  } catch (error) {
    logger.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get conversation',
        statusCode: 500,
      },
    });
  }
});

// Send message to user
router.post('/', sendMessageValidation, async (req: Request, res: Response) => {
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
    const { content, receiverId } = req.body;

    // Check if receiver exists and is active
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true, isActive: true },
    });

    if (!receiver || !receiver.isActive) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Receiver not found or inactive',
          statusCode: 404,
        },
      });
    }

    // Prevent self-messaging
    if (currentUserId === receiverId) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Cannot send message to yourself',
          statusCode: 400,
        },
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: currentUserId,
        receiverId,
        isRead: false,
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

    // Send notification to receiver
    await addNotificationJob({
      userId: receiverId,
      type: 'NEW_MESSAGE',
      title: 'New Message',
      message: `${(req as any).user.name} sent you a message`,
      data: {
        messageId: message.id,
        senderId: currentUserId,
        senderName: (req as any).user.name,
      },
    });

    logAuthEvent('Message Sent', currentUserId, {
      receiverId,
      messageId: message.id,
    });

    res.status(201).json({
      success: true,
      data: { message },
      message: 'Message sent successfully',
    });
  } catch (error) {
    logger.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to send message',
        statusCode: 500,
      },
    });
  }
});

// Mark conversation as read
router.put('/:userId/read', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { userId } = req.params;

    // Mark all messages from target user as read
    const result = await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: currentUserId,
        isRead: false,
      },
      data: { isRead: true },
    });

    res.json({
      success: true,
      data: { markedCount: result.count },
      message: 'Messages marked as read',
    });
  } catch (error) {
    logger.error('Mark messages read error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to mark messages as read',
        statusCode: 500,
      },
    });
  }
});

// Delete message
router.delete('/:messageId', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { messageId } = req.params;

    // Find message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, senderId: true, content: true },
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Message not found',
          statusCode: 404,
        },
      });
    }

    // Check if user is the sender
    if (message.senderId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to delete this message',
          statusCode: 403,
        },
      });
    }

    // Delete message
    await prisma.message.delete({
      where: { id: messageId },
    });

    logAuthEvent('Message Deleted', currentUserId, { messageId });

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    logger.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete message',
        statusCode: 500,
      },
    });
  }
});

// Get unread message count
router.get('/unread/count', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;

    const unreadCount = await prisma.message.count({
      where: {
        receiverId: currentUserId,
        isRead: false,
      },
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

// Create message thread (for group conversations)
router.post('/threads', createThreadValidation, async (req: Request, res: Response) => {
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
    const { participants, subject, jobId } = req.body;

    // Ensure current user is in participants
    if (!participants.includes(currentUserId)) {
      participants.push(currentUserId);
    }

    // Validate all participants exist and are active
    const validParticipants = await prisma.user.findMany({
      where: {
        id: { in: participants },
        isActive: true,
      },
      select: { id: true, name: true },
    });

    if (validParticipants.length !== participants.length) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'One or more participants not found or inactive',
          statusCode: 400,
        },
      });
    }

    // Create message thread
    const thread = await prisma.messageThread.create({
      data: {
        participants: JSON.stringify(participants),
        subject: subject || 'Group Conversation',
        jobId,
      },
    });

    logAuthEvent('Message Thread Created', currentUserId, {
      threadId: thread.id,
      participantCount: participants.length,
    });

    res.status(201).json({
      success: true,
      data: { thread },
      message: 'Message thread created successfully',
    });
  } catch (error) {
    logger.error('Create thread error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create message thread',
        statusCode: 500,
      },
    });
  }
});

// Get message threads for current user
router.get('/threads', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;

    const threads = await prisma.messageThread.findMany({
      where: {
        participants: {
          contains: currentUserId,
        },
        isActive: true,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            companyName: true,
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    res.json({
      success: true,
      data: { threads },
    });
  } catch (error) {
    logger.error('Get threads error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get message threads',
        statusCode: 500,
      },
    });
  }
});

export default router;