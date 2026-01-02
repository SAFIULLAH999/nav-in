import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma-mock'

export const dynamic = 'force-dynamic'

// GET - Browse users for network connections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')

    // For demo purposes, we'll create mock user data
    const mockUsers = [
      {
        id: 'user-1',
        name: 'Alice Johnson',
        username: 'alice.johnson',
        avatar: '',
        title: 'Senior Software Engineer',
        company: 'TechCorp Inc.',
        location: 'San Francisco, CA',
        bio: 'Passionate about building scalable web applications and mentoring junior developers.',
        skills: 'React, TypeScript, Node.js, AWS',
        mutualConnections: 5,
        connectionStatus: 'none'
      },
      {
        id: 'user-2',
        name: 'Bob Smith',
        username: 'bob.smith',
        avatar: '',
        title: 'Product Manager',
        company: 'InnovateTech',
        location: 'New York, NY',
        bio: 'Driving product strategy and cross-functional collaboration to deliver exceptional user experiences.',
        skills: 'Product Strategy, Agile, User Research',
        mutualConnections: 8,
        connectionStatus: 'none'
      },
      {
        id: 'user-3',
        name: 'Carol Davis',
        username: 'carol.davis',
        avatar: '',
        title: 'UX Designer',
        company: 'DesignStudio',
        location: 'Austin, TX',
        bio: 'Creating intuitive and beautiful user interfaces that solve real-world problems.',
        skills: 'UI/UX Design, Figma, User Testing',
        mutualConnections: 12,
        connectionStatus: 'none'
      },
      {
        id: 'user-4',
        name: 'David Wilson',
        username: 'david.wilson',
        avatar: '',
        title: 'Data Scientist',
        company: 'DataInsights LLC',
        location: 'Seattle, WA',
        bio: 'Transforming complex data into actionable insights using machine learning and statistical analysis.',
        skills: 'Python, Machine Learning, SQL',
        mutualConnections: 3,
        connectionStatus: 'none'
      },
      {
        id: 'user-5',
        name: 'Emma Brown',
        username: 'emma.brown',
        avatar: '',
        title: 'Marketing Director',
        company: 'GrowthCo',
        location: 'Los Angeles, CA',
        bio: 'Building brand awareness and driving customer acquisition through innovative marketing strategies.',
        skills: 'Digital Marketing, SEO, Content Strategy',
        mutualConnections: 7,
        connectionStatus: 'none'
      }
    ]

    // Apply basic filters if provided
    const locationFilter = searchParams.get('location')?.trim().toLowerCase()
    const companyFilter = searchParams.get('company')?.trim().toLowerCase()
    const skillsFilter = searchParams.get('skills')?.trim().toLowerCase()

    let filteredUsers = mockUsers

    if (locationFilter) {
      filteredUsers = filteredUsers.filter(user => 
        user.location.toLowerCase().includes(locationFilter)
      )
    }

    if (companyFilter) {
      filteredUsers = filteredUsers.filter(user => 
        user.company.toLowerCase().includes(companyFilter)
      )
    }

    if (skillsFilter) {
      filteredUsers = filteredUsers.filter(user => 
        user.skills.toLowerCase().includes(skillsFilter)
      )
    }

    // Apply pagination
    const paginatedUsers = filteredUsers.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: paginatedUsers
    })
  } catch (error) {
    console.error('Error browsing users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to browse users' },
      { status: 500 }
    )
  }
}
