import { NextRequest, NextResponse } from 'next/server'
import { saveWatchData } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { videoId, watchPercentage, duration } = await request.json()

    if (!videoId || watchPercentage === undefined) {
      return NextResponse.json(
        { error: 'Video ID and watch percentage are required' },
        { status: 400 }
      )
    }

    await saveWatchData(videoId, {
      watchPercentage,
      duration,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving watch data:', error)
    return NextResponse.json(
      { error: 'Failed to save watch data' },
      { status: 500 }
    )
  }
}


