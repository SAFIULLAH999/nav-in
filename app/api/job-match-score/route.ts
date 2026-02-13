import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Calculate job match score
function calculateMatchScore(job: any, user: any): {
  overallScore: number
  skillMatch: number
  experienceMatch: number
  educationMatch: number
  locationMatch: number
  cultureFit: number
  keywordsMatch: number
  requiredSkillsMatched: string[]
  requiredSkillsMissing: string[]
  niceToHaveSkillsMatched: string[]
  niceToHaveSkillsMissing: string[]
  experienceLevel: string
  locationCompatibility: string
} {
  // Parse job requirements
  const jobSkills = JSON.parse(job.skills || '[]')
  const jobRequirements = JSON.parse(job.requirements || '[]')
  const jobLocation = job.location.toLowerCase()
  const jobType = job.type
  const jobExperience = job.experience

  // Parse user data
  const userSkills = JSON.parse(user.skills || '[]')
  const userExperiences = user.experiences || []
  const userEducation = user.education || []
  const userLocation = user.location?.toLowerCase() || ''
  const userLanguages = JSON.parse(user.language || '[]')

  // Calculate skill match
  const requiredSkills = jobSkills.filter((skill: any) => skill.required)
  const niceToHaveSkills = jobSkills.filter((skill: any) => !skill.required)

  const requiredSkillsMatched = requiredSkills.filter((skill: any) =>
    userSkills.some((userSkill: any) => userSkill.name.toLowerCase() === skill.name.toLowerCase())
  )

  const niceToHaveSkillsMatched = niceToHaveSkills.filter((skill: any) =>
    userSkills.some((userSkill: any) => userSkill.name.toLowerCase() === skill.name.toLowerCase())
  )

  const skillMatch = Math.round(
    (requiredSkillsMatched.length / Math.max(requiredSkills.length, 1)) * 100
  )

  // Calculate experience match
  const totalExperienceYears = userExperiences.reduce((total: number, exp: any) => {
    const endDate = exp.endDate ? new Date(exp.endDate) : new Date()
    const startDate = new Date(exp.startDate)
    const years = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 365)
    return total + years
  }, 0)

  let experienceMatch = 0
  let experienceLevel = 'ENTRY'

  if (jobExperience === 'ENTRY' && totalExperienceYears < 2) {
    experienceMatch = 100
    experienceLevel = 'ENTRY'
  } else if (jobExperience === 'JUNIOR' && totalExperienceYears >= 2 && totalExperienceYears < 5) {
    experienceMatch = 100
    experienceLevel = 'JUNIOR'
  } else if (jobExperience === 'MID' && totalExperienceYears >= 5 && totalExperienceYears < 8) {
    experienceMatch = 100
    experienceLevel = 'MID'
  } else if (jobExperience === 'SENIOR' && totalExperienceYears >= 8 && totalExperienceYears < 12) {
    experienceMatch = 100
    experienceLevel = 'SENIOR'
  } else if (jobExperience === 'LEAD' && totalExperienceYears >= 12) {
    experienceMatch = 100
    experienceLevel = 'LEAD'
  } else {
    // Partial match based on years
    const requiredYears = jobExperience === 'ENTRY' ? 0 :
                         jobExperience === 'JUNIOR' ? 2 :
                         jobExperience === 'MID' ? 5 :
                         jobExperience === 'SENIOR' ? 8 : 12

    experienceMatch = Math.min(100, Math.round((totalExperienceYears / requiredYears) * 100))
    experienceLevel = jobExperience
  }

  // Calculate education match
  const educationMatch = userEducation.length > 0 ? 80 : 40

  // Calculate location match
  let locationMatch = 0
  let locationCompatibility = 'REMOTE'

  if (job.isRemote) {
    locationMatch = 100
    locationCompatibility = 'REMOTE'
  } else if (userLocation && jobLocation.includes(userLocation)) {
    locationMatch = 100
    locationCompatibility = 'ON_SITE'
  } else {
    // Calculate distance or compatibility
    locationMatch = 30
    locationCompatibility = 'HYBRID'
  }

  // Calculate culture fit (simplified)
  const cultureFit = 70

  // Calculate keywords match
  const jobDescription = (job.description || '').toLowerCase()
  const userSkillsText = userSkills.map((s: any) => s.name.toLowerCase()).join(' ')
  const keywordsMatch = userSkillsText.length > 0 ? 60 : 30

  // Calculate overall score
  const overallScore = Math.round(
    (skillMatch * 0.4) +
    (experienceMatch * 0.3) +
    (educationMatch * 0.1) +
    (locationMatch * 0.15) +
    (cultureFit * 0.05)
  )

  return {
    overallScore,
    skillMatch,
    experienceMatch,
    educationMatch,
    locationMatch,
    cultureFit,
    keywordsMatch,
    requiredSkillsMatched: requiredSkillsMatched.map((s: any) => s.name),
    requiredSkillsMissing: requiredSkills
      .filter((skill: any) => !requiredSkillsMatched.some((m: any) => m.name === skill.name))
      .map((s: any) => s.name),
    niceToHaveSkillsMatched: niceToHaveSkillsMatched.map((s: any) => s.name),
    niceToHaveSkillsMissing: niceToHaveSkills
      .filter((skill: any) => !niceToHaveSkillsMatched.some((m: any) => m.name === skill.name))
      .map((s: any) => s.name),
    experienceLevel,
    locationCompatibility
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')
    const targetUserId = searchParams.get('userId') || userId

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Get job and user data
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true
      }
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        experiences: true,
        education: true,
        userSkills: {
          include: {
            skill: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if match score already exists and is recent (within 1 hour)
    const existingScore = await prisma.jobMatchScore.findUnique({
      where: {
        jobId_userId: {
          jobId,
          userId: targetUserId
        }
      }
    })

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    if (existingScore && existingScore.updatedAt > oneHourAgo) {
      return NextResponse.json({
        success: true,
        data: {
          ...existingScore,
          requiredSkillsMatched: JSON.parse(existingScore.requiredSkillsMatched),
          requiredSkillsMissing: JSON.parse(existingScore.requiredSkillsMissing),
          niceToHaveSkillsMatched: JSON.parse(existingScore.niceToHaveSkillsMatched),
          niceToHaveSkillsMissing: JSON.parse(existingScore.niceToHaveSkillsMissing)
        }
      })
    }

    // Calculate new match score
    const matchData = calculateMatchScore(job, user)

    // Create or update match score
    const matchScore = await prisma.jobMatchScore.upsert({
      where: {
        jobId_userId: {
          jobId,
          userId: targetUserId
        }
      },
      update: {
        ...matchData,
        requiredSkillsMatched: JSON.stringify(matchData.requiredSkillsMatched),
        requiredSkillsMissing: JSON.stringify(matchData.requiredSkillsMissing),
        niceToHaveSkillsMatched: JSON.stringify(matchData.niceToHaveSkillsMatched),
        niceToHaveSkillsMissing: JSON.stringify(matchData.niceToHaveSkillsMissing)
      },
      create: {
        jobId,
        userId: targetUserId,
        ...matchData,
        requiredSkillsMatched: JSON.stringify(matchData.requiredSkillsMatched),
        requiredSkillsMissing: JSON.stringify(matchData.requiredSkillsMissing),
        niceToHaveSkillsMatched: JSON.stringify(matchData.niceToHaveSkillsMatched),
        niceToHaveSkillsMissing: JSON.stringify(matchData.niceToHaveSkillsMissing)
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...matchScore,
        requiredSkillsMatched: JSON.parse(matchScore.requiredSkillsMatched),
        requiredSkillsMissing: JSON.parse(matchScore.requiredSkillsMissing),
        niceToHaveSkillsMatched: JSON.parse(matchScore.niceToHaveSkillsMatched),
        niceToHaveSkillsMissing: JSON.parse(matchScore.niceToHaveSkillsMissing)
      }
    })
  } catch (error) {
    console.error('Error calculating match score:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    const body = await req.json()
    const { jobId, forceRecalculate = false } = body

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Get job and user data
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: true
      }
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        experiences: true,
        education: true,
        userSkills: {
          include: {
            skill: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if match score exists and is recent
    const existingScore = await prisma.jobMatchScore.findUnique({
      where: {
        jobId_userId: {
          jobId,
          userId
        }
      }
    })

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    if (existingScore && existingScore.updatedAt > oneHourAgo && !forceRecalculate) {
      return NextResponse.json({
        success: true,
        data: {
          ...existingScore,
          requiredSkillsMatched: JSON.parse(existingScore.requiredSkillsMatched),
          requiredSkillsMissing: JSON.parse(existingScore.requiredSkillsMissing),
          niceToHaveSkillsMatched: JSON.parse(existingScore.niceToHaveSkillsMatched),
          niceToHaveSkillsMissing: JSON.parse(existingScore.niceToHaveSkillsMissing)
        }
      })
    }

    // Calculate new match score
    const matchData = calculateMatchScore(job, user)

    // Create or update match score
    const matchScore = await prisma.jobMatchScore.upsert({
      where: {
        jobId_userId: {
          jobId,
          userId
        }
      },
      update: {
        ...matchData,
        requiredSkillsMatched: JSON.stringify(matchData.requiredSkillsMatched),
        requiredSkillsMissing: JSON.stringify(matchData.requiredSkillsMissing),
        niceToHaveSkillsMatched: JSON.stringify(matchData.niceToHaveSkillsMatched),
        niceToHaveSkillsMissing: JSON.stringify(matchData.niceToHaveSkillsMissing)
      },
      create: {
        jobId,
        userId,
        ...matchData,
        requiredSkillsMatched: JSON.stringify(matchData.requiredSkillsMatched),
        requiredSkillsMissing: JSON.stringify(matchData.requiredSkillsMissing),
        niceToHaveSkillsMatched: JSON.stringify(matchData.niceToHaveSkillsMatched),
        niceToHaveSkillsMissing: JSON.stringify(matchData.niceToHaveSkillsMissing)
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...matchScore,
        requiredSkillsMatched: JSON.parse(matchScore.requiredSkillsMatched),
        requiredSkillsMissing: JSON.parse(matchScore.requiredSkillsMissing),
        niceToHaveSkillsMatched: JSON.parse(matchScore.niceToHaveSkillsMatched),
        niceToHaveSkillsMissing: JSON.parse(matchScore.niceToHaveSkillsMissing)
      }
    })
  } catch (error) {
    console.error('Error calculating match score:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    const userId = decoded.userId

    const { searchParams } = new URL(req.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json({ error: 'Job ID is required' }, { status: 400 })
    }

    // Delete match score
    await prisma.jobMatchScore.delete({
      where: {
        jobId_userId: {
          jobId,
          userId
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Match score deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting match score:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}