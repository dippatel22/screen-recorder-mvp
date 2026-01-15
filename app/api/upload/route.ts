import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { saveVideoMetadata } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const video = formData.get('video') as Blob

    if (!video) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      )
    }

    // Generate unique video ID
    const videoId = uuidv4()
    const timestamp = Date.now()
    const filename = `${videoId}_${timestamp}.webm`

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save video file
    const filepath = path.join(uploadDir, filename)
    const buffer = Buffer.from(await video.arrayBuffer())
    await writeFile(filepath, buffer)

    // Generate default name
    const defaultName = `Recording ${new Date().toLocaleString()}`

    // Save metadata to database
    await saveVideoMetadata({
      id: videoId,
      name: defaultName,
      filename,
      uploadedAt: new Date().toISOString(),
      viewCount: 0,
      watchData: [],
    })

    return NextResponse.json({
      videoId,
      message: 'Video uploaded successfully',
    })
  } catch (error) {
    console.error('Error uploading video:', error)
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    )
  }
}

