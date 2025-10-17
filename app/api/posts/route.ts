import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000, 'Content too long'),
  image: z.string().url().optional(),
  video: z.string().url().optional(),
})

// GET - Fetch posts for feed with engagement algorithm
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    // Get current user for personalized feed (optional)
    const authResult = await authenticateRequest(request)
    const currentUserId = ('user' in authResult) ? authResult.user.userId : null

    // Enhanced feed algorithm: combine recency + engagement
    const posts = await prisma.post.findMany({
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
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
            comments: true,
            shares: true
          }
        }
      }
    })

    // Transform the data for frontend
    const transformedPosts = posts.map(post => ({
      id: post.id,
      author: {
        name: post.author.name || 'Unknown User',
        username: post.author.username || 'user',
        avatar: post.author.avatar || '',
        title: post.author.title || 'NavIN User'
      },
      content: post.content,
      timestamp: post.createdAt.toISOString(),
      likes: post._count.likes,
      comments: post._count.comments,
      shares: post._count.shares,
      liked: post.likes.length > 0,
      image: post.image,
      video: post.video
    }))

    return NextResponse.json({
      success: true,
      data: transformedPosts,
      pagination: {
        page,
        limit,
        hasMore: posts.length === limit
      }
    })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST - Create a new post
export async function POST(request: NextRequest) {
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
    const { content, image, video } = createPostSchema.parse(body)

    // Get current user
    const currentUserId = authResult.user.userId

    // Create the post
    const newPost = await prisma.post.create({
      data: {
        content: content.trim(),
        image: image || null,
        video: video || null,
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
          }
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true
          }
        }
      }
    })

    // Transform for frontend response
    const transformedPost = {
      id: newPost.id,
      author: {
        name: newPost.author.name || 'Unknown User',
        username: newPost.author.username || 'user',
        avatar: newPost.author.avatar || '',
        title: newPost.author.title || 'NavIN User'
      },
      content: newPost.content,
      timestamp: newPost.createdAt.toISOString(),
      likes: newPost._count.likes,
      comments: newPost._count.comments,
      shares: newPost._count.shares,
      liked: false,
      image: newPost.image,
      video: newPost.video
    }

    return NextResponse.json({
      success: true,
      data: transformedPost,
      message: 'Post created successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
