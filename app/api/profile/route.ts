import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch user profile
export async function GET(request: NextRequest) {
  try {
    // In a real app, you would fetch from database
    const userProfile = {
      id: '1',
      name: 'John Doe',
      title: 'Senior Software Engineer',
      company: 'NavIN Corp',
      location: 'San Francisco, CA',
      email: 'john.doe@navin.com',
      bio: 'Passionate software engineer with 5+ years of experience in full-stack development.',
      website: 'https://johndoe.dev',
      avatar: 'JD',
      connections: 1234,
      skills: ['React', 'TypeScript', 'Node.js', 'Python', 'AWS'],
      experience: [
        {
          id: '1',
          title: 'Senior Software Engineer',
          company: 'NavIN Corp',
          startDate: '2022-01',
          endDate: 'Present',
          description: 'Lead development of key platform features, mentor junior developers, and architect scalable solutions.'
        }
      ],
      education: [
        {
          id: '1',
          degree: 'Bachelor of Science in Computer Science',
          school: 'University of California, Berkeley',
          startDate: '2016-09',
          endDate: '2020-05',
          description: 'GPA: 3.8/4.0 • Relevant Coursework: Data Structures, Algorithms, Software Engineering'
        }
      ]
    }

    return NextResponse.json({ success: true, data: userProfile })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, title, company, location, email, bio, website, skills, experience, education } = body

    // In a real app, you would update the database
    const updatedProfile = {
      id: '1',
      name: name || 'John Doe',
      title: title || 'Senior Software Engineer',
      company: company || 'NavIN Corp',
      location: location || 'San Francisco, CA',
      email: email || 'john.doe@navin.com',
      bio: bio || 'Passionate software engineer with 5+ years of experience in full-stack development.',
      website: website || 'https://johndoe.dev',
      avatar: 'JD',
      connections: 1234,
      skills: skills || ['React', 'TypeScript', 'Node.js', 'Python', 'AWS'],
      experience: experience || [],
      education: education || []
    }

    return NextResponse.json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
