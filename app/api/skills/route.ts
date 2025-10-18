import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const addSkillSchema = z.object({
  name: z.string().min(1, 'Skill name is required').max(50, 'Skill name too long'),
  category: z.string().optional(),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).default('INTERMEDIATE')
})

// GET - Get all available skills for autocomplete
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category')

    const skills = await prisma.skill.findMany({
      where: {
        AND: [
          search ? {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          } : {},
          category ? { category } : {}
        ]
      },
      orderBy: { name: 'asc' },
      take: 20
    })

    return NextResponse.json({
      success: true,
      data: skills
    })
  } catch (error) {
    console.error('Error fetching skills:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch skills' },
      { status: 500 }
    )
  }
}

// POST - Add a skill to user's profile
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
    const { name, category, level } = addSkillSchema.parse(body)

    const currentUserId = authResult.user.userId

    // Find or create the skill
    let skill = await prisma.skill.findUnique({
      where: { name }
    })

    if (!skill) {
      skill = await prisma.skill.create({
        data: {
          name,
          category
        }
      })
    }

    // Check if user already has this skill
    const existingUserSkill = await prisma.userSkill.findUnique({
      where: {
        userId_skillId: {
          userId: currentUserId,
          skillId: skill.id
        }
      }
    })

    if (existingUserSkill) {
      return NextResponse.json(
        { success: false, error: 'You already have this skill' },
        { status: 400 }
      )
    }

    // Add skill to user
    const userSkill = await prisma.userSkill.create({
      data: {
        userId: currentUserId,
        skillId: skill.id,
        level
      },
      include: {
        skill: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: userSkill.id,
        skill: userSkill.skill,
        level: userSkill.level,
        createdAt: userSkill.createdAt.toISOString()
      },
      message: 'Skill added successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error adding skill:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add skill' },
      { status: 500 }
    )
  }
}