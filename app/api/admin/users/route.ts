import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { JWTManager } from '@/lib/jwt'
import { Logger } from '@/lib/logger'

// GET - List all users with admin controls
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const payload = JWTManager.verifyAccessToken(token)

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user is admin (you might want to add an admin role field)
    const currentUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true }
    })

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // For demo purposes, allow all authenticated users as admin
    // In production, check for admin role: if (currentUser.role !== 'ADMIN')

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || 'all'

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status !== 'all') {
      where.isActive = status === 'active'
    }

    // Get users with activity counts
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          title: true,
          company: true,
          isActive: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              posts: true,
              sentConnections: true,
              jobs: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    Logger.info('Admin users list accessed', {
      adminId: payload.userId,
      totalUsers: totalCount,
      page,
      limit
    })

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: page * limit < totalCount,
        hasPrevPage: page > 1
      }
    })
  } catch (error) {
    Logger.error('Admin users list error', error as Error, {
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
