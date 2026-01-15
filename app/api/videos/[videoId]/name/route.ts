import { NextRequest, NextResponse } from 'next/server'
import { updateVideoName, getVideoMetadata } from '@/lib/database'

export async function PUT(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const videoId = params.videoId
    const { name } = await request.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Valid name is required' },
        { status: 400 }
      )
    }

    // Check if video exists
    const video = await getVideoMetadata(videoId)
    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Update the name
    await updateVideoName(videoId, name.trim())

    return NextResponse.json({ success: true, name: name.trim() })
  } catch (error) {
    console.error('Error updating video name:', error)
    return NextResponse.json(
      { error: 'Failed to update video name' },
      { status: 500 }
    )
  }
}


