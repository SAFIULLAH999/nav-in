import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const updateSkillLevelSchema = z.object({
  skillId: z.string().min(1, 'Skill ID is required'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
})

// GET - Get user's skills
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

    const userSkills = await prisma.userSkill.findMany({
      where: { userId: currentUserId },
      include: {
        skill: true,
        receivedEndorsements: {
          include: {
            giver: {
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

    const transformedSkills = userSkills.map(userSkill => ({
      id: userSkill.id,
      skill: {
        id: userSkill.skill.id,
        name: userSkill.skill.name,
        category: userSkill.skill.category
      },
      level: userSkill.level,
      endorsementsCount: userSkill.receivedEndorsements.length,
      endorsements: userSkill.receivedEndorsements.map(endorsement => ({
        id: endorsement.id,
        giver: endorsement.giver,
        message: endorsement.message,
        createdAt: endorsement.createdAt.toISOString()
      })),
      createdAt: userSkill.createdAt.toISOString()
    }))

    return NextResponse.json({
      success: true,
      data: transformedSkills
    })
  } catch (error) {
    console.error('Error fetching user skills:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}

// PUT - Update skill level
export async function PUT(request: NextRequest) {
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
    const { skillId, level } = updateSkillLevelSchema.parse(body)

    const currentUserId = authResult.user.userId

    // Update skill level
    const updatedSkill = await prisma.userSkill.update({
      where: {
        userId_skillId: {
          userId: currentUserId,
          skillId
        }
      },
      data: { level },
      include: { skill: true }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedSkill.id,
        skill: updatedSkill.skill,
        level: updatedSkill.level,
        createdAt: updatedSkill.createdAt.toISOString()
      },
      message: 'Skill level updated successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating skill level:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update skill level' },
      { status: 500 }
    )
  }
}

// DELETE - Remove skill from user's profile
export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const skillId = searchParams.get('skillId')

    if (!skillId) {
      return NextResponse.json(
        { success: false, error: 'Skill ID is required' },
        { status: 400 }
      )
    }

    const currentUserId = authResult.user.userId

    // Delete skill and all related endorsements
    await prisma.$transaction([
      prisma.endorsement.deleteMany({
        where: {
          OR: [
            { giverId: { contains: skillId } }, // This needs to be fixed based on actual schema
            { receiverId: { contains: skillId } }
          ]
        }
      }),
      prisma.userSkill.delete({
        where: {
          userId_skillId: {
            userId: currentUserId,
            skillId
          }
        }
      })
    ])

    return NextResponse.json({
      success: true,
      message: 'Skill removed successfully'
    })
  } catch (error) {
    console.error('Error removing skill:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove skill' },
      { status: 500 }
    )
  }
}