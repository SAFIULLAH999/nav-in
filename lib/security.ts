import rateLimit from 'express-rate-limit'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

// Rate limiting configurations
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    error: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown'
  }
})

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many API requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress || 'unknown'
  }
})

export const uploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: {
    error: 'Too many uploads, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Custom rate limiting with database
export class RateLimiter {
  static async checkRateLimit(key: string, maxRequests: number = 100, windowMs: number = 15 * 60 * 1000): Promise<boolean> {
    const windowStart = new Date(Date.now() - windowMs)

    const existing = await prisma.rateLimit.findUnique({
      where: { key }
    })

    if (!existing || existing.windowStart < windowStart) {
      // Create new window
      await prisma.rateLimit.upsert({
        where: { key },
        update: {
          count: 1,
          windowStart: new Date()
        },
        create: {
          key,
          count: 1,
          windowStart: new Date()
        }
      })
      return true
    }

    if (existing.count >= maxRequests) {
      return false
    }

    // Increment count
    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } }
    })

    return true
  }
}

// Input validation and sanitization
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '')
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// XSS Prevention
export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// CSRF Protection (for API routes)
export function generateCSRFToken(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15)
}

export function validateCSRFToken(token: string, sessionToken: string): boolean {
  return token === sessionToken
}

// Security headers middleware
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  }
}
