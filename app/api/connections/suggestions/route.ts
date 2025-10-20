import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'
import { canSuggestUser, sanitizeUserData } from '@/lib/privacy'

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)

    if ('error' in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: 401 }
      )
    }

    const currentUserId = authResult.user.userId
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') || '10'), 50)

    // Get current user's connections and profile
    const [currentUserConnections, currentUser] = await Promise.all([
      prisma.connection.findMany({
        where: {
          OR: [
            { senderId: currentUserId, status: 'ACCEPTED' },
            { receiverId: currentUserId, status: 'ACCEPTED' }
          ]
        },
        select: {
          senderId: true,
          receiverId: true
        }
      }),
      prisma.user.findUnique({
        where: { id: currentUserId },
        select: {
          id: true,
          company: true,
          location: true,
          skills: true,
          title: true
        }
      })
    ])

    // Get IDs of already connected users
    const connectedUserIds = new Set(
      currentUserConnections.flatMap(conn =>
        [conn.senderId, conn.receiverId].filter(id => id !== currentUserId)
      )
    )

    // Get second-degree connections (friends of friends)
    const secondDegreeConnections = await prisma.connection.findMany({
      where: {
        OR: [
          { senderId: { in: Array.from(connectedUserIds) }, status: 'ACCEPTED' },
          { receiverId: { in: Array.from(connectedUserIds) }, status: 'ACCEPTED' }
        ]
      },
      select: {
        senderId: true,
        receiverId: true
      }
    })

    // Count frequency of second-degree connections
    const suggestionScores = new Map<string, number>()
    secondDegreeConnections.forEach(conn => {
      const otherUserId = conn.senderId === currentUserId ? null :
                         conn.senderId in connectedUserIds ? conn.receiverId :
                         conn.receiverId in connectedUserIds ? conn.senderId : null

      if (otherUserId && !connectedUserIds.has(otherUserId)) {
        suggestionScores.set(otherUserId, (suggestionScores.get(otherUserId) || 0) + 1)
      }
    })

    // Get users with same company or location
    let companyLocationMatches: string[] = []
    if (currentUser?.company || currentUser?.location) {
      const orConditions = []
      if (currentUser.company) {
        orConditions.push({ company: { contains: currentUser.company } })
      }
      if (currentUser.location) {
        orConditions.push({ location: { contains: currentUser.location } })
      }

      const locationMatches = await prisma.user.findMany({
        where: {
          AND: [
            { id: { not: currentUserId } },
            { id: { notIn: Array.from(connectedUserIds) } },
            { OR: orConditions }
          ]
        },
        select: { id: true },
        take: limit
      })
      companyLocationMatches = locationMatches.map(user => user.id)
    }

    // Get users with similar skills/interests
    let skillMatches: string[] = []
    if (currentUser?.skills) {
      try {
        const userSkills = JSON.parse(currentUser.skills || '[]')
        if (userSkills.length > 0) {
          const skillMatchesQuery = await prisma.user.findMany({
            where: {
              AND: [
                { id: { not: currentUserId } },
                { id: { notIn: Array.from(connectedUserIds) } },
                {
                  skills: {
                    contains: userSkills[0] // Match users who have at least one similar skill
                  }
                }
              ]
            },
            select: { id: true },
            take: Math.floor(limit / 2)
          })
          skillMatches = skillMatchesQuery.map(user => user.id)
        }
      } catch (error) {
        console.error('Error parsing user skills:', error)
      }
    }

    // Get users from same industry/field
    let industryMatches: string[] = []
    if (currentUser?.title) {
      // Extract potential industry keywords from title
      const titleWords = currentUser.title.toLowerCase().split(' ')
      const industryKeywords = titleWords.filter(word =>
        word.length > 3 && !['senior', 'junior', 'lead', 'principal', 'staff', 'manager', 'director'].includes(word)
      )

      if (industryKeywords.length > 0) {
        const industryMatchesQuery = await prisma.user.findMany({
          where: {
            AND: [
              { id: { not: currentUserId } },
              { id: { notIn: Array.from(connectedUserIds) } },
              {
                OR: industryKeywords.map(keyword => ({
                  title: { contains: keyword, mode: 'insensitive' }
                }))
              }
            ]
          },
          select: { id: true },
          take: Math.floor(limit / 3)
        })
        industryMatches = industryMatchesQuery.map(user => user.id)
      }
    }

    // Combine and score suggestions
    const allSuggestions = new Map<string, {
      userId: string
      score: number
      reasons: string[]
    }>()

    // Add second-degree connections with scores
    suggestionScores.forEach((score, userId) => {
      if (!allSuggestions.has(userId)) {
        allSuggestions.set(userId, {
          userId,
          score,
          reasons: [`${score} mutual connection${score > 1 ? 's' : ''}`]
        })
      }
    })

    // Add company/location matches with enhanced scoring
    companyLocationMatches.forEach(userId => {
      if (!allSuggestions.has(userId)) {
        const reasons = []
        let score = 3 // Base score for location matches

        if (currentUser?.company) {
          reasons.push('Same company')
          score += 2 // Higher score for company matches
        }
        if (currentUser?.location) {
          reasons.push('Same location')
          score += 1
        }

        allSuggestions.set(userId, {
          userId,
          score,
          reasons
        })
      } else {
        // Boost score for users who match multiple criteria
        const existing = allSuggestions.get(userId)!
        existing.score += 2
        if (currentUser?.company) existing.reasons.push('Same company')
        if (currentUser?.location) existing.reasons.push('Same location')
      }
    })

    // Add skill-based matches
    skillMatches.forEach(userId => {
      if (!allSuggestions.has(userId)) {
        allSuggestions.set(userId, {
          userId,
          score: 4, // Good score for skill matches
          reasons: ['Similar skills']
        })
      } else {
        // Boost score for users who match multiple criteria
        const existing = allSuggestions.get(userId)!
        existing.score += 1
        if (!existing.reasons.includes('Similar skills')) {
          existing.reasons.push('Similar skills')
        }
      }
    })

    // Add industry/field matches
    industryMatches.forEach(userId => {
      if (!allSuggestions.has(userId)) {
        allSuggestions.set(userId, {
          userId,
          score: 3, // Moderate score for industry matches
          reasons: ['Same industry']
        })
      } else {
        // Boost score for users who match multiple criteria
        const existing = allSuggestions.get(userId)!
        existing.score += 1
        if (!existing.reasons.includes('Same industry')) {
          existing.reasons.push('Same industry')
        }
      }
    })

    // Get top suggestions
    const topSuggestions = Array.from(allSuggestions.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit * 2) // Get more candidates to account for privacy filtering

    // Get user details for suggestions
    const suggestedUserIds = topSuggestions.map(s => s.userId)
    const suggestedUsers = await prisma.user.findMany({
      where: {
        id: { in: suggestedUserIds },
        isActive: true
      },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        title: true,
        company: true,
        location: true,
        bio: true,
        skills: true
      }
    })

    // Filter users based on privacy settings and sanitize data
    const filteredSuggestions = []
    for (const user of suggestedUsers) {
      const canSuggest = await canSuggestUser(user.id, currentUserId)
      if (canSuggest) {
        const suggestion = topSuggestions.find(s => s.userId === user.id)
        const sanitizedUser = await sanitizeUserData(user, user.id, currentUserId)

        filteredSuggestions.push({
          ...sanitizedUser,
          suggestionScore: suggestion?.score || 0,
          reasons: suggestion?.reasons || ['Available to connect']
        })
      }
    }

    // Limit final results
    const finalSuggestions = filteredSuggestions.slice(0, limit)

    return NextResponse.json({
      success: true,
      data: finalSuggestions
    })
  } catch (error) {
    console.error('Error fetching suggestions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch suggestions' },
      { status: 500 }
    )
  }
}