import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/jwt'

// GET - Get skills gap insights for the user
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

    // Get user's profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        title: true,
        company: true,
        industry: true,
        skills: true,
        experiences: {
          select: { title: true, company: true },
          orderBy: { startDate: 'desc' },
          take: 5
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    // Mock trending skills based on industry
    const trendingSkills = getTrendingSkills(user.industry || 'Technology')

    // Parse user's skills
    const userSkills = user.skills ? JSON.parse(user.skills) : []

    // Find gaps
    const skillGaps = trendingSkills.filter(skill => !userSkills.includes(skill.name))

    // Calculate skill score
    const skillScore = Math.round((userSkills.length / (userSkills.length + skillGaps.length)) * 100)

    // Generate recommendations
    const recommendations = skillGaps.slice(0, 5).map(skill => ({
      skill: skill.name,
      reason: skill.reason,
      priority: skill.priority,
      learningResources: skill.resources
    }))

    return NextResponse.json({
      success: true,
      data: {
        currentSkills: userSkills,
        skillScore,
        skillGaps: skillGaps.length,
        recommendations,
        trendingSkills: trendingSkills.slice(0, 10).map(skill => skill.name),
        industry: user.industry || 'General'
      }
    })
  } catch (error) {
    console.error('Error fetching skills gap insights:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}

// Mock function to get trending skills based on industry
function getTrendingSkills(industry: string) {
  const skillData: Record<string, Array<{ name: string, reason: string, priority: string, resources: string[] }>> = {
    'Technology': [
      { name: 'Machine Learning', reason: 'High demand in AI-driven applications', priority: 'High', resources: ['Coursera ML Course', 'TensorFlow Docs'] },
      { name: 'Cloud Architecture', reason: 'Essential for scalable systems', priority: 'High', resources: ['AWS Solutions Architect', 'Azure Fundamentals'] },
      { name: 'DevOps', reason: 'Critical for modern development workflows', priority: 'Medium', resources: ['Docker Documentation', 'Kubernetes Guide'] },
      { name: 'Cybersecurity', reason: 'Increasing importance for data protection', priority: 'High', resources: ['CompTIA Security+', 'OWASP Resources'] },
      { name: 'React Native', reason: 'Growing mobile development needs', priority: 'Medium', resources: ['React Native Docs', 'Expo Tutorials'] }
    ],
    'Finance': [
      { name: 'Data Analysis', reason: 'Essential for financial modeling', priority: 'High', resources: ['Excel Advanced', 'Python for Finance'] },
      { name: 'Risk Management', reason: 'Critical for compliance and stability', priority: 'High', resources: ['FRM Certification', 'Risk Management Books'] },
      { name: 'Blockchain', reason: 'Emerging in fintech applications', priority: 'Medium', resources: ['Blockchain Basics', 'Ethereum Docs'] }
    ],
    'Healthcare': [
      { name: 'Medical Informatics', reason: 'Digital transformation in healthcare', priority: 'High', resources: ['Health IT Courses', 'HL7 Standards'] },
      { name: 'Telemedicine', reason: 'Growing remote healthcare services', priority: 'Medium', resources: ['Telehealth Guidelines', 'HIPAA Compliance'] }
    ]
  }

  return skillData[industry] || skillData['Technology']
}