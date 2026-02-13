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
    const giverId = decoded.userId

    const body = await req.json()
    const { receiverId, skillId, message } = body

    if (!receiverId || !skillId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if the giver has the skill they're endorsing
    const giverSkill = await prisma.userSkill.findFirst({
      where: {
        userId: giverId,
        skillId: skillId
      }
    })

    if (!giverSkill) {
      return NextResponse.json({ error: 'You must have this skill to endorse others' }, { status: 400 })
    }

    // Check if endorsement already exists
    const existingEndorsement = await prisma.endorsement.findFirst({
      where: {
        giverId,
        receiverId,
        skillId
      }
    })

    if (existingEndorsement) {
      return NextResponse.json({ error: 'You have already endorsed this skill' }, { status: 400 })
    }

    // Create endorsement
    const endorsement = await prisma.endorsement.create({
      data: {
        giverId,
        receiverId,
        skillId,
        message: message || null
      }
    })

    return NextResponse.json({
      success: true,
      endorsement
    })
  } catch (error) {
    console.error('Error creating endorsement:', error)
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
    const targetUserId = searchParams.get('userId') || userId

    // Get endorsements for a specific user
    const endorsements = await prisma.endorsement.findMany({
      where: {
        receiverId: targetUserId
      },
      include: {
        giver: {
          select: {
            user: {
              select: {
                id: true,
                name: true,
                title: true,
                avatar: true
              }
            }
          }
        },
        receiver: {
          select: {
            skill: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: endorsements.map(endorsement => ({
        id: endorsement.id,
        giver: endorsement.giver.user,
        skill: endorsement.receiver.skill,
        message: endorsement.message,
        createdAt: endorsement.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching endorsements:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
