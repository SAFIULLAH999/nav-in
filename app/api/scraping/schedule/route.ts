import { NextRequest, NextResponse } from 'next/server'

// POST - Schedule a job fetching task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchQuery, location, limit, delay } = body

    // Mock job scheduling since backend queue service might not be available
    const mockJobId = `mock-job-${Date.now()}`
    
    // In a real implementation, this would use addJobFetchingJob
    // For now, we'll just return a success response
    console.log('Job fetching scheduled (mock):', {
      searchQuery: searchQuery || 'software engineer',
      location: location || 'remote',
      limit: limit || 50,
      delay: delay || 0
    })

    return NextResponse.json({
      success: true,
      message: 'Job fetching scheduled successfully',
      jobId: mockJobId,
      note: 'This is a mock response. Backend queue service integration available when configured.'
    })
  } catch (error) {
    console.error('Error scheduling job fetching:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to schedule job fetching' },
      { status: 500 }
    )
  }
}
