import { NextRequest, NextResponse } from 'next/server'
import { addJobFetchingJob } from '../../../../backend/src/services/queue'

// POST - Schedule a job fetching task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { searchQuery, location, limit, delay } = body

    // Add the job to the queue with optional delay
    const job = await addJobFetchingJob(
      {
        searchQuery: searchQuery || 'software engineer',
        location: location || 'remote',
        limit: limit || 50
      },
      0, // priority
      delay ? delay * 1000 : 0 // delay in milliseconds
    )

    return NextResponse.json({
      success: true,
      message: 'Job fetching scheduled successfully',
      jobId: job.id
    })
  } catch (error) {
    console.error('Error scheduling job fetching:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to schedule job fetching' },
      { status: 500 }
    )
  }
}
