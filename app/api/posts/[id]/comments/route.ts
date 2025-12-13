import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(500, 'Comment too long'),
  parentId: z.string().optional()
})

// GET - Fetch comments for a post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const postId = params.id

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Get current user for like status
    const authResult = await authenticateRequest(request)
    const currentUserId = ('user' in authResult) ? authResult.user.userId : null

    const comments = await prisma.comment.findMany({
      where: {
        postId: postId,
        parentId: null // Only top-level comments
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
          }
        },
        likes: currentUserId ? {
          where: { userId: currentUserId },
          select: { id: true }
        } : false,
        _count: {
          select: {
            likes: true,
            replies: true
          }
        }
      }
    })

    // Transform comments for frontend
    const transformedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      timestamp: comment.createdAt.toISOString(),
      author: {
        name: (comment as any).user.name || 'Unknown User',
        username: (comment as any).user.username || 'user',
        avatar: (comment as any).user.avatar || '',
        title: (comment as any).user.title || 'NavIN User'
      },
      likes: (comment as any)._count.likes,
      repliesCount: (comment as any)._count.replies,
      liked: (comment as any).likes ? (comment as any).likes.length > 0 : false,
      parentId: comment.parentId
    }))

    return NextResponse.json({
      success: true,
      data: transformedComments,
      pagination: {
        page,
        limit,
        hasMore: comments.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, parentId } = createCommentSchema.parse(body)

    const postId = params.id
    const userId = authResult.user.userId

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    })

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // If parentId is provided, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId }
      })

      if (!parentComment || parentComment.postId !== postId) {
        return NextResponse.json(
          { success: false, error: 'Parent comment not found' },
          { status: 404 }
        )
      }
    }

    // Create the comment
    const newComment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: userId,
        postId: postId,
        parentId: parentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatar: true,
            title: true,
          }
        },
        _count: {
          select: {
            likes: true,
            replies: true
          }
        }
      }
    })

    // Transform for frontend response
    const transformedComment = {
      id: newComment.id,
      content: newComment.content,
      timestamp: newComment.createdAt.toISOString(),
      author: {
        name: (newComment as any).user.name || 'Unknown User',
        username: (newComment as any).user.username || 'user',
        avatar: (newComment as any).user.avatar || '',
        title: (newComment as any).user.title || 'NavIN User'
      },
      likes: (newComment as any)._count.likes,
      repliesCount: (newComment as any)._count.replies,
      liked: false,
      parentId: newComment.parentId
    }

    return NextResponse.json({
      success: true,
      data: transformedComment,
      message: 'Comment created successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating comment:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
