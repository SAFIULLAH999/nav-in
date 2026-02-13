import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const requesterId = decoded.userId

    const body = await req.json()
    const { recommenderId, relationship, position, message } = body

    if (!recommenderId || !relationship) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create recommendation request
    const recommendation = await prisma.recommendation.create({
      data: {
        requesterId,
        recommenderId,
        relationship,
        position: position || null,
        content: message || '',
        status: 'PENDING'
      }
    })

    return NextResponse.json({
      success: true,
      recommendation
    })
  } catch (error) {
    console.error('Error requesting recommendation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || 'ACCEPTED'

    // Get recommendations received by the user
    const recommendations = await prisma.recommendation.findMany({
      where: {
        requesterId: userId,
        status: status
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: recommendations
    })
  } catch (error) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}