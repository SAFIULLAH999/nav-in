import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../utils/prisma';
import { logger, logAuthEvent } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { addNotificationJob } from '../services/queue';
import { publishPostEvent, publishUserEvent, AblyEventTypes } from '../services/ably';

const router = Router();

// All post routes require authentication
router.use(authenticateToken);

// Validation rules
const createPostValidation = [
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Content must be between 1 and 2000 characters'),
  body('image').optional().isURL().withMessage('Image must be a valid URL'),
  body('video').optional().isURL().withMessage('Video must be a valid URL'),
];

const createCommentValidation = [
  body('content').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters'),
  body('parentId').optional().isUUID().withMessage('Invalid parent comment ID'),
];

// Get feed posts (posts from connections and followed users)
router.get('/feed', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get users that current user is connected to or following
    const connections = await prisma.connection.findMany({
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

    const follows = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const connectedUserIds = new Set([
      ...connections.map(c => c.senderId),
      ...connections.map(c => c.receiverId),
      ...follows.map(f => f.followingId),
    ]);

    // Include current user's own posts
    connectedUserIds.add(currentUserId);

    const posts = await prisma.post.findMany({
      where: {
        authorId: {
          in: Array.from(connectedUserIds),
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            company: true,
          },
        },
        likes: {
          where: { userId: currentUserId },
          select: { id: true },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
      ],
      take: limit,
      skip: offset,
    });

    // Transform posts to include like status
    const transformedPosts = posts.map(post => ({
      ...post,
      isLiked: post.likes.length > 0,
      likes: undefined, // Remove the likes array from response
    }));

    res.json({
      success: true,
      data: {
        posts: transformedPosts,
        pagination: {
          page,
          limit,
          hasMore: posts.length === limit,
        },
      },
    });
  } catch (error) {
    logger.error('Get feed error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get feed',
        statusCode: 500,
      },
    });
  }
});

// Get all posts (public endpoint)
router.get('/', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user?.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            company: true,
          },
        },
        likes: currentUserId ? {
          where: { userId: currentUserId },
          select: { id: true },
        } : false,
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Transform posts to include like status if user is authenticated
    const transformedPosts = posts.map(post => ({
      ...post,
      isLiked: currentUserId ? post.likes.length > 0 : false,
      likes: undefined, // Remove the likes array from response
    }));

    res.json({
      success: true,
      data: {
        posts: transformedPosts,
        pagination: {
          page,
          limit,
          hasMore: posts.length === limit,
        },
      },
    });
  } catch (error) {
    logger.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get posts',
        statusCode: 500,
      },
    });
  }
});

// Get post by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = (req as any).user?.id;

    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            company: true,
          },
        },
        likes: currentUserId ? {
          where: { userId: currentUserId },
          select: { id: true },
        } : false,
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Post not found',
          statusCode: 404,
        },
      });
    }

    res.json({
      success: true,
      data: {
        post: {
          ...post,
          isLiked: currentUserId ? post.likes.length > 0 : false,
          likes: undefined,
        },
      },
    });
  } catch (error) {
    logger.error('Get post error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get post',
        statusCode: 500,
      },
    });
  }
});

// Create new post
router.post('/', createPostValidation, async (req: Request, res: Response) => {
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
    const { content, image, video } = req.body;

    const post = await prisma.post.create({
      data: {
        content,
        image,
        video,
        authorId: currentUserId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
            company: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    logAuthEvent('Post Created', currentUserId, {
      postId: post.id,
      contentLength: content.length,
    });

    // Publish real-time event
    await publishPostEvent(post.id, AblyEventTypes.POST_CREATED, {
      postId: post.id,
      authorId: currentUserId,
      authorName: (req as any).user.name,
      content: content.substring(0, 100), // First 100 chars for preview
    });

    // Publish to user's followers/connections
    await publishUserEvent(currentUserId, AblyEventTypes.POST_CREATED, {
      postId: post.id,
      authorId: currentUserId,
      authorName: (req as any).user.name,
    });

    res.status(201).json({
      success: true,
      data: { post },
      message: 'Post created successfully',
    });
  } catch (error) {
    logger.error('Create post error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to create post',
        statusCode: 500,
      },
    });
  }
});

// Update post
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { id } = req.params;
    const { content, image, video } = req.body;

    // Check if post exists and user is the author
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Post not found',
          statusCode: 404,
        },
      });
    }

    if (existingPost.authorId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to edit this post',
          statusCode: 403,
        },
      });
    }

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        content,
        image,
        video,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
    });

    logAuthEvent('Post Updated', currentUserId, { postId: id });

    res.json({
      success: true,
      data: { post: updatedPost },
      message: 'Post updated successfully',
    });
  } catch (error) {
    logger.error('Update post error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to update post',
        statusCode: 500,
      },
    });
  }
});

// Delete post
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { id } = req.params;

    // Check if post exists and user is the author
    const existingPost = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorId: true },
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Post not found',
          statusCode: 404,
        },
      });
    }

    if (existingPost.authorId !== currentUserId) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Not authorized to delete this post',
          statusCode: 403,
        },
      });
    }

    await prisma.post.delete({
      where: { id },
    });

    logAuthEvent('Post Deleted', currentUserId, { postId: id });

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  } catch (error) {
    logger.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to delete post',
        statusCode: 500,
      },
    });
  }
});

// Like/Unlike post
router.post('/:id/like', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { id: postId } = req.params;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Post not found',
          statusCode: 404,
        },
      });
    }

    // Check if like already exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: currentUserId,
          postId,
        },
      },
    });

    if (existingLike) {
      // Unlike the post
      await prisma.like.delete({
        where: { id: existingLike.id },
      });

      logAuthEvent('Post Unliked', currentUserId, { postId });

      res.json({
        success: true,
        data: { liked: false },
        message: 'Post unliked successfully',
      });
    } else {
      // Like the post
      await prisma.like.create({
        data: {
          userId: currentUserId,
          postId,
        },
      });

      // Send notification to post author if not liking own post
      if (post.authorId !== currentUserId) {
        await addNotificationJob({
          userId: post.authorId,
          type: 'POST_LIKE',
          title: 'New Like',
          message: `${(req as any).user.name} liked your post`,
          data: {
            postId,
            likerId: currentUserId,
            likerName: (req as any).user.name,
          },
        });
      }

      logAuthEvent('Post Liked', currentUserId, { postId });

      // Publish real-time event
      await publishPostEvent(postId, AblyEventTypes.POST_LIKED, {
        postId,
        likerId: currentUserId,
        likerName: (req as any).user.name,
        authorId: post.authorId,
      });

      res.json({
        success: true,
        data: { liked: true },
        message: 'Post liked successfully',
      });
    }
  } catch (error) {
    logger.error('Like post error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to like post',
        statusCode: 500,
      },
    });
  }
});

// Get post comments
router.get('/:id/comments', async (req: Request, res: Response) => {
  try {
    const { id: postId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const comments = await prisma.comment.findMany({
      where: { postId },
      include: {
        user: {
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

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          hasMore: comments.length === limit,
        },
      },
    });
  } catch (error) {
    logger.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to get comments',
        statusCode: 500,
      },
    });
  }
});

// Add comment to post
router.post('/:id/comments', createCommentValidation, async (req: Request, res: Response) => {
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
    const { id: postId } = req.params;
    const { content, parentId } = req.body;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Post not found',
          statusCode: 404,
        },
      });
    }

    // If parent comment, check if it exists and belongs to the same post
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true },
      });

      if (!parentComment || parentComment.postId !== postId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid parent comment',
            statusCode: 400,
          },
        });
      }
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        userId: currentUserId,
        postId,
        parentId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    // Send notification to post author if not commenting on own post
    if (post.authorId !== currentUserId) {
      await addNotificationJob({
        userId: post.authorId,
        type: 'POST_COMMENT',
        title: 'New Comment',
        message: `${(req as any).user.name} commented on your post`,
        data: {
          postId,
          commentId: comment.id,
          commenterId: currentUserId,
          commenterName: (req as any).user.name,
        },
      });
    }

    logAuthEvent('Comment Added', currentUserId, { postId, commentId: comment.id });

    // Publish real-time event
    await publishPostEvent(postId, AblyEventTypes.POST_COMMENTED, {
      postId,
      commentId: comment.id,
      commenterId: currentUserId,
      commenterName: (req as any).user.name,
      content: content.substring(0, 100), // First 100 chars for preview
      authorId: post.authorId,
    });

    res.status(201).json({
      success: true,
      data: { comment },
      message: 'Comment added successfully',
    });
  } catch (error) {
    logger.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to add comment',
        statusCode: 500,
      },
    });
  }
});

// Share post
router.post('/:id/share', async (req: Request, res: Response) => {
  try {
    const currentUserId = (req as any).user.id;
    const { id: postId } = req.params;

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, content: true },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Post not found',
          statusCode: 404,
        },
      });
    }

    // Check if already shared
    const existingShare = await prisma.share.findUnique({
      where: {
        userId_postId: {
          userId: currentUserId,
          postId,
        },
      },
    });

    if (existingShare) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'Post already shared',
          statusCode: 409,
        },
      });
    }

    // Create share
    const share = await prisma.share.create({
      data: {
        userId: currentUserId,
        postId,
      },
    });

    // Send notification to post author if not sharing own post
    if (post.authorId !== currentUserId) {
      await addNotificationJob({
        userId: post.authorId,
        type: 'POST_SHARE',
        title: 'Post Shared',
        message: `${(req as any).user.name} shared your post`,
        data: {
          postId,
          shareId: share.id,
          sharerId: currentUserId,
          sharerName: (req as any).user.name,
        },
      });
    }

    logAuthEvent('Post Shared', currentUserId, { postId });

    res.status(201).json({
      success: true,
      data: { share },
      message: 'Post shared successfully',
    });
  } catch (error) {
    logger.error('Share post error:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to share post',
        statusCode: 500,
      },
    });
  }
});

export default router;