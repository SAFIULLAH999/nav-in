import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { z } from 'zod'

const createEducationSchema = z.object({
  institution: z.string().min(1, 'Institution is required'),
  degree: z.string().min(1, 'Degree is required'),
  fieldOfStudy: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  grade: z.string().optional(),
  description: z.string().optional()
})

// GET - Get user's education
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

    const education = await prisma.education.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: education
    })
  } catch (error) {
    console.error('Error fetching education:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch education' },
      { status: 500 }
    )
  }
}

// POST - Add education
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
    const validatedData = createEducationSchema.parse(body)

    const userId = authResult.user.userId

    const education = await prisma.education.create({
      data: {
        ...validatedData,
        userId,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null
      }
    })

    return NextResponse.json({
      success: true,
      data: education,
      message: 'Education added successfully'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error adding education:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to add education' },
      { status: 500 }
    )
  }
}