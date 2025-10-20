import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const createExperienceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  company: z.string().min(1, 'Company is required'),
  location: z.string().optional(),
  isCurrent: z.boolean().default(false),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  description: z.string().optional()
})

// GET - Get user's work experience
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const userId = authResult.user.userId

    const experiences = await prisma.experience.findMany({
      where: { userId },
      orderBy: [
        { isCurrent: 'desc' },
        { startDate: 'desc' }
      ]
    })

    return NextResponse.json({
      success: true,
      data: experiences
    })
  } catch (error) {
    console.error('Error fetching experience:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch experience' },
      { status: 500 }
    )
  }
}

// POST - Add work experience
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = createExperienceSchema.parse(body)

    const userId = authResult.user.userId

    const experience = await prisma.experience.create({
      data: {
        ...validatedData,
        userId,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null
      }
    })

    return NextResponse.json({
      success: true,
      data: experience,
      message: 'Work experience added successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error adding experience:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add experience' },
      { status: 500 }
    )
  }
}