import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    // Get user profile for personalized recommendations
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        title: true,
        skills: true,
        location: true,
        experiences: {
          select: {
            title: true,
            company: true,
            description: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Simple AI-powered recommendation algorithm
    const recommendations = await generateRecommendations(user)

    return NextResponse.json({
      success: true,
      recommendations
    })
  } catch (error) {
    console.error('Error generating recommendations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function generateRecommendations(user: any) {
  const recommendations: any[] = []
  const userSkills = user.skills ? JSON.parse(user.skills) : []
  const userTitle = user.title || ''

  // Recommend jobs based on user skills and experience
  const recommendedJobs = await prisma.job.findMany({
    where: {
      isActive: true,
      OR: [
        {
          skills: {
            contains: userSkills.join(',') || userTitle
          }
        },
        {
          title: {
            contains: userTitle.split(' ')[0] || ''
          }
        }
      ]
    },
    take: 5,
    include: {
      author: {
        select: {
          name: true,
          avatar: true
        }
      }
    }
  })

  // Recommend posts from users with similar skills/interests
  const recommendedPosts = await prisma.post.findMany({
    where: {
      authorId: {
        not: user.id
      }
    },
    take: 5,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
          title: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  // Recommend users to connect with
  const recommendedUsers = await prisma.user.findMany({
    where: {
      id: { not: user.id },
      isActive: true,
      OR: [
        { title: { contains: userTitle } },
        { location: user.location }
      ]
    },
    take: 5,
    select: {
      id: true,
      name: true,
      title: true,
      avatar: true,
      location: true
    }
  })

  return {
    jobs: recommendedJobs.map(job => ({
      id: job.id,
      title: job.title,
      companyName: job.companyName,
      location: job.location,
      type: job.type,
      matchScore: calculateMatchScore(user, job),
      author: job.author
    })),
    posts: recommendedPosts.map(post => ({
      id: post.id,
      content: post.content,
      author: post.author,
      timestamp: post.createdAt.toISOString(),
      relevanceScore: calculateRelevanceScore(user, post)
    })),
    users: recommendedUsers.map(networkUser => ({
      id: networkUser.id,
      name: networkUser.name,
      title: networkUser.title,
      avatar: networkUser.avatar,
      location: networkUser.location,
      connectionScore: calculateConnectionScore(user, networkUser)
    }))
  }
}

function calculateMatchScore(user: any, job: any): number {
  let score = 0
  const userSkills = user.skills ? JSON.parse(user.skills) : []
  const jobSkills = job.skills ? JSON.parse(job.skills) : []

  // Title match
  if (user.title && job.title.toLowerCase().includes(user.title.toLowerCase().split(' ')[0])) {
    score += 30
  }

  // Skills match
  const skillMatches = userSkills.filter((skill: string) =>
    jobSkills.some((jobSkill: string) => jobSkill.toLowerCase().includes(skill.toLowerCase()))
  ).length
  score += skillMatches * 20

  // Location match (bonus if same location)
  if (user.location && job.location === user.location) {
    score += 10
  }

  return Math.min(score, 100)
}

function calculateRelevanceScore(user: any, post: any): number {
  let score = 50 // Base relevance score

  // Author connection (if they're in same company or role)
  if (post.author.title && user.title &&
      post.author.title.toLowerCase().includes(user.title.toLowerCase().split(' ')[0])) {
    score += 25
  }

  // Recent posts get higher score
  const daysSincePost = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  if (daysSincePost < 1) score += 15
  else if (daysSincePost < 7) score += 10
  else if (daysSincePost < 30) score += 5

  return Math.min(score, 100)
}

function calculateConnectionScore(user: any, networkUser: any): number {
  let score = 50 // Base connection score

  // Same location
  if (user.location && networkUser.location === user.location) {
    score += 25
  }

  // Similar job titles
  if (user.title && networkUser.title &&
      user.title.toLowerCase().split(' ')[0] === networkUser.title.toLowerCase().split(' ')[0]) {
    score += 25
  }

  return Math.min(score, 100)
}