import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { EmailService } from '@/lib/email'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters').regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores').optional(),
  title: z.string().optional(),
  company: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, username, title, company } = registerSchema.parse(body)

    // Generate username if not provided
    let finalUsername = username
    if (!finalUsername) {
      // Generate from email or name
      const baseUsername = name.toLowerCase().replace(/\s+/g, '') || email.split('@')[0]
      finalUsername = baseUsername
      let counter = 1
      while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
        finalUsername = `${baseUsername}${counter}`
        counter++
      }
    }

    // Check if username is already taken
    const existingUserByUsername = await prisma.user.findUnique({
      where: { username: finalUsername }
    })
    if (existingUserByUsername) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user (unverified initially)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        username: finalUsername,
        title,
        company,
        emailVerified: null, // User starts unverified
      }
    })

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store verification token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: tokenExpiry
      }
    })

    // Send verification email (don't block registration if email fails)
    try {
      await EmailService.sendEmailVerification(email, name, verificationToken)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Continue with registration even if email fails
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message: 'User created successfully. Please check your email to verify your account.',
        user: userWithoutPassword,
        requiresVerification: true
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
