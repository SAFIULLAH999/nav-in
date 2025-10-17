import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { firebaseAuth } from '@/lib/firebase-auth'

// GET - Fetch posts for feed
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

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
        }
      }
    })

    // Transform the data for frontend
    const transformedPosts = posts.map(post => ({
      id: post.id,
      author: {
        name: post.author.name || 'Unknown User',
        username: post.author.username || post.author.email?.split('@')[0] || 'user',
        avatar: post.author.avatar || '',
        title: post.author.title || 'NavIN User'
      },
      content: post.content,
      timestamp: post.createdAt.toISOString(),
      likes: 0, // TODO: Implement likes system
      comments: 0, // TODO: Implement comments system
      shares: 0, // TODO: Implement shares system
      liked: false,
      image: post.image
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
    // Get current user from auth
    const currentUser = firebaseAuth.getCurrentUser()
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { content, image } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Post content is required' },
        { status: 400 }
      )
    }

    // Find or create user in database
    let dbUser = await prisma.user.findUnique({
      where: { email: currentUser.email! }
    })

    if (!dbUser) {
      // Create user in database
      dbUser = await prisma.user.create({
        data: {
          email: currentUser.email!,
          name: currentUser.displayName || currentUser.email!.split('@')[0],
          username: currentUser.email!.split('@')[0],
          isActive: true,
        }
      })
    }

    // Create the post
    const newPost = await prisma.post.create({
      data: {
        content: content.trim(),
        image: image || null,
        authorId: dbUser.id,
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
        }
      }
    })

    // Transform for frontend response
    const transformedPost = {
      id: newPost.id,
      author: {
        name: newPost.author.name || 'Unknown User',
        username: newPost.author.username || newPost.author.email?.split('@')[0] || 'user',
        avatar: newPost.author.avatar || '',
        title: newPost.author.title || 'NavIN User'
      },
      content: newPost.content,
      timestamp: newPost.createdAt.toISOString(),
      likes: 0,
      comments: 0,
      shares: 0,
      liked: false,
      image: newPost.image
    }

    return NextResponse.json({
      success: true,
      data: transformedPost,
      message: 'Post created successfully'
    })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
