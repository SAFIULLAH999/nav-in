import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email'
import { z } from 'zod'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 }
      )
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 hour from now

    // Clean up any existing unused reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        used: false
      }
    })

    // Store reset token in database
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expires: resetTokenExpiry
      }
    })

    // Send password reset email
    try {
      await EmailService.sendPasswordResetEmail(user.email, user.name || 'User', resetToken)
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError)
      // Don't reveal email sending failures to the user
    }

    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset link has been sent.' },
      { status: 200 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
