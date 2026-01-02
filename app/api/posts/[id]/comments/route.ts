import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(500, 'Comment too long'),
  parentId: z.string().optional()
})

// Mock comments data
const mockComments: Array<{
  id: string;
  content: string;
  timestamp: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    title: string;
  };
  likes: number;
  repliesCount: number;
  liked: boolean;
  parentId: string | null;
}> = [
  {
    id: 'comment-1',
    content: 'Great post! Thanks for sharing this insight.',
    timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    author: {
      name: 'Alice Johnson',
      username: 'alice.johnson',
      avatar: '',
      title: 'Software Engineer'
    },
    likes: 3,
    repliesCount: 1,
    liked: false,
    parentId: null
  },
  {
    id: 'comment-2',
    content: 'I completely agree with this perspective.',
    timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    author: {
      name: 'Bob Smith',
      username: 'bob.smith',
      avatar: '',
      title: 'Product Manager'
    },
    likes: 1,
    repliesCount: 0,
    liked: false,
    parentId: null
  }
]

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

    // Get current user for like status (try both header and cookie)
    let currentUserId = null
    try {
      const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                   request.cookies.get('accessToken')?.value
      
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
        currentUserId = decoded.userId
      }
    } catch (error) {
      // Authentication failed, but continue without auth
      console.log('Authentication failed for comments fetch, continuing without auth')
    }

    // For demo purposes, return mock comments
    const paginatedComments = mockComments.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedComments,
      pagination: {
        page,
        limit,
        hasMore: mockComments.length > offset + limit
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
    let userId = null
    try {
      const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                   request.cookies.get('accessToken')?.value
      
      if (!token) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
      userId = decoded.userId
    } catch (authError) {
      return NextResponse.json(
        { success: false, error: 'Invalid authentication token' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, parentId } = createCommentSchema.parse(body)

    // Create a new comment (in a real app, this would save to database)
    const newComment = {
      id: `comment-${Date.now()}`,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      author: {
        name: 'Current User',
        username: 'current.user',
        avatar: '',
        title: 'Professional'
      },
      likes: 0,
      repliesCount: 0,
      liked: false,
      parentId: parentId || null
    }

    // Add to mock comments array (in a real app, this would be saved to database)
    mockComments.unshift(newComment)

    return NextResponse.json({
      success: true,
      data: newComment,
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
