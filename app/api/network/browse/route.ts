import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

export const dynamic = 'force-dynamic'

// GET - Browse users for network connections
export async function GET(request: NextRequest) {
  try {
    // Authenticate user (optional for browsing)
    let currentUserId = null
    try {
      const authResult = await authenticateRequest(request)
      currentUserId = authResult && 'user' in authResult ? authResult.user.userId : null
    } catch (error) {
      // Authentication failed, but continue without authentication
      console.log('Authentication failed for network browse, continuing without auth')
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')
    const locationFilter = searchParams.get('location')?.trim()
    const companyFilter = searchParams.get('company')?.trim()
    const skillsFilter = searchParams.get('skills')?.trim()
    const institutionFilter = searchParams.get('institution')?.trim()

    // Build where conditions
    let userWhereConditions: any[] = []

    // Add filters if provided
    if (locationFilter) {
      userWhereConditions.push({ location: { contains: locationFilter, mode: 'insensitive' } })
    }

    if (companyFilter) {
      userWhereConditions.push({ company: { contains: companyFilter, mode: 'insensitive' } })
    }

    if (skillsFilter) {
      userWhereConditions.push({ skills: { contains: skillsFilter, mode: 'insensitive' } })
    }

    if (institutionFilter) {
      userWhereConditions.push({ education: { some: { institution: { contains: institutionFilter, mode: 'insensitive' } } } })
    }

    const userWhere = {
      ...(userWhereConditions.length > 0 ? { OR: userWhereConditions } : {}),
      isActive: true,
      emailVerified: { not: null }, // Only include users with verified emails
      ...(currentUserId && { id: { not: currentUserId } }) // Exclude current user
    }

    // Get users with connection status
    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        title: true,
        company: true,
        location: true,
        bio: true,
        skills: true,
      },
      take: limit,
      skip: offset,
      orderBy: { name: 'asc' }
    })

    // Calculate mutual connections for each user
    const usersWithMutualConnections = await Promise.all(
      users.map(async (user) => {
        if (!currentUserId) {
          return { ...user, mutualConnections: 0, connectionStatus: 'none' }
        }

        // Get user's connections
        const userConnections = await prisma.connection.findMany({
          where: {
            OR: [
              { senderId: user.id, status: 'ACCEPTED' },
              { receiverId: user.id, status: 'ACCEPTED' }
            ]
          },
          select: {
            senderId: true,
            receiverId: true
          }
        })

        // Get current user's connections
        const currentUserConnections = await prisma.connection.findMany({
          where: {
            OR: [
              { senderId: currentUserId, status: 'ACCEPTED' },
              { receiverId: currentUserId, status: 'ACCEPTED' }
            ]
          },
          select: {
            senderId: true,
            receiverId: true
          }
        })

        const userConnectedIds = new Set([
          ...userConnections.map(c => c.senderId === user.id ? c.receiverId : c.senderId)
        ])

        const currentUserConnectedIds = new Set([
          ...currentUserConnections.map(c => c.senderId === currentUserId ? c.receiverId : c.senderId)
        ])

        const mutualConnections = Array.from(userConnectedIds).filter(id => currentUserConnectedIds.has(id)).length

        // Check connection status
        const existingConnection = await prisma.connection.findFirst({
          where: {
            OR: [
              { senderId: currentUserId, receiverId: user.id },
              { senderId: user.id, receiverId: currentUserId }
            ]
          }
        })

        let connectionStatus = 'none'
        if (existingConnection) {
          connectionStatus = existingConnection.status.toLowerCase()
        }

        return {
          ...user,
          mutualConnections,
          connectionStatus
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: usersWithMutualConnections
    })
  } catch (error) {
    console.error('Error browsing users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to browse users' },
      { status: 500 }
    )
  }
}
