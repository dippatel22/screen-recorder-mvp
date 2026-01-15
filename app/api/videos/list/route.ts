import { NextResponse } from 'next/server'
import { getAllVideos } from '@/lib/database'

export async function GET() {
  try {
    const videos = await getAllVideos()
    return NextResponse.json({ videos })
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos', videos: [] },
      { status: 500 }
    )
  }
}


