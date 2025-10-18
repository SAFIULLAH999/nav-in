import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const giveEndorsementSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  skillId: z.string().min(1, 'Skill ID is required'),
  message: z.string().max(200, 'Message too long').optional()
})

// GET - Get endorsements given by current user
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const currentUserId = authResult.user.userId

    const givenEndorsements = await prisma.endorsement.findMany({
      where: {
        giver: {
          userId: currentUserId
        }
      },
      include: {
        receiver: {
          include: {
            skill: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const transformedEndorsements = givenEndorsements.map(endorsement => ({
      id: endorsement.id,
      skill: endorsement.receiver.skill,
      receiver: endorsement.receiver.user,
      message: endorsement.message,
      createdAt: endorsement.createdAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: transformedEndorsements
    })
  } catch (error) {
    console.error('Error fetching endorsements:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch endorsements' },
      { status: 500 }
    )
  }
}

// POST - Give an endorsement
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
    const { receiverId, skillId, message } = giveEndorsementSchema.parse(body)

    const currentUserId = authResult.user.userId

    // Prevent self-endorsement
    if (currentUserId === receiverId) {
      return NextResponse.json(
        { success: false, error: 'Cannot endorse yourself' },
        { status: 400 }
      )
    }

    // Check if receiver exists and is active
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    })

    if (!receiver || !receiver.isActive) {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 404 }
      )
    }

    // Check if receiver has the skill
    const receiverSkill = await prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId: receiverId,
          skillId
        }
      }
    })

    if (!receiverSkill) {
      return NextResponse.json(
        { success: false, error: 'User does not have this skill' },
        { status: 400 }
      )
    }

    // Check if giver has the same skill (you should have a skill to endorse it)
    const giverSkill = await prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId: currentUserId,
          skillId
        }
      }
    })

    if (!giverSkill) {
      return NextResponse.json(
        { success: false, error: 'You must have this skill to endorse others' },
        { status: 400 }
      )
    }

    // Check if endorsement already exists
    const existingEndorsement = await prisma.endorsement.findUnique({
      where: {
        giverId_receiverId_skillId: {
          giverId: giverSkill.id,
          receiverId: receiverSkill.id,
          skillId
        }
      }
    })

    if (existingEndorsement) {
      return NextResponse.json(
        { success: false, error: 'You have already endorsed this skill' },
        { status: 400 }
      )
    }

    // Create endorsement
    const endorsement = await prisma.endorsement.create({
      data: {
        giverId: giverSkill.id,
        receiverId: receiverSkill.id,
        skillId,
        message: message?.trim() || null
      },
      include: {
        receiver: {
          include: {
            skill: true,
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatar: true,
                title: true
              }
            }
          }
        }
      }
    })

    // Create notification for receiver
    await prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'ENDORSEMENT',
        title: 'New Skill Endorsement',
        message: `${authResult.user.name || 'Someone'} endorsed your ${endorsement.receiver.skill.name} skill`,
        data: JSON.stringify({
          endorsementId: endorsement.id,
          skillId,
          endorserId: currentUserId
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: endorsement.id,
        skill: endorsement.receiver.skill,
        receiver: endorsement.receiver.user,
        message: endorsement.message,
        createdAt: endorsement.createdAt.toISOString()
      },
      message: 'Endorsement given successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error giving endorsement:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to give endorsement' },
      { status: 500 }
    )
  }
}