import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { JWTManager, hashPassword, verifyPassword } from '@/lib/jwt'
import { validateData, profileUpdateSchema } from '@/lib/validations'
import { validateEmail, validatePassword as validatePasswordUtil } from '@/lib/security'

// POST - Login with JWT
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    // Basic validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // For demo purposes, we'll accept any password
    // In production, you'd verify the hashed password:
    // const isValidPassword = await verifyPassword(password, user.password)
    const isValidPassword = true // Demo mode

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate tokens
    const accessToken = JWTManager.generateAccessToken({
      userId: user.id,
      email: user.email
    })

    const refreshToken = JWTManager.generateRefreshToken({
      userId: user.id,
      email: user.email
    })

    // Store refresh token
    await JWTManager.storeRefreshToken(user.id, refreshToken)

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    // Set secure cookie for refresh token
    const response = NextResponse.json({
      success: true,
      data: {
        accessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          avatar: user.avatar
        }
      },
      message: 'Login successful'
    })

    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    )
  }
}

// POST - Refresh access token
export async function PUT(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (!refreshToken) {
      return NextResponse.json(
        { success: false, error: 'Refresh token not found' },
        { status: 401 }
      )
    }

    // Verify refresh token
    const payload = JWTManager.verifyRefreshToken(refreshToken)

    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid refresh token' },
        { status: 401 }
      )
    }

    // Check if refresh token is valid in database
    const isValid = await JWTManager.isRefreshTokenValid(refreshToken)

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Refresh token revoked or expired' },
        { status: 401 }
      )
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate new access token
    const newAccessToken = JWTManager.generateAccessToken({
      userId: user.id,
      email: user.email
    })

    return NextResponse.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          username: user.username,
          avatar: user.avatar
        }
      },
      message: 'Token refreshed successfully'
    })
  } catch (error) {
    console.error('Token refresh error:', error)
    return NextResponse.json(
      { success: false, error: 'Token refresh failed' },
      { status: 500 }
    )
  }
}

// DELETE - Logout (revoke refresh token)
export async function DELETE(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('refreshToken')?.value

    if (refreshToken) {
      // Verify and revoke the refresh token
      const payload = JWTManager.verifyRefreshToken(refreshToken)

      if (payload) {
        await JWTManager.revokeRefreshToken(refreshToken)
      }
    }

    // Clear the cookie
    const response = NextResponse.json({
      success: true,
      message: 'Logout successful'
    })

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0
    })

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { success: false, error: 'Logout failed' },
      { status: 500 }
    )
  }
}
