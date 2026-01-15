'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'

interface VideoData {
  id: string
  name: string
  filename: string
  uploadedAt: string
  viewCount: number
  watchData: Array<{
    watchPercentage: number
    duration?: number
    timestamp: string
  }>
}

export default function WatchPage() {
  const params = useParams()
  const videoId = params.videoId as string
  const [video, setVideo] = useState<VideoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [averageWatchPercentage, setAverageWatchPercentage] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const viewTrackedRef = useRef(false)
  const lastPercentageRef = useRef(0)

  useEffect(() => {
    fetchVideo()
  }, [videoId])

  const fetchVideo = async () => {
    try {
      const response = await fetch(`/api/video/${videoId}`)
      if (!response.ok) {
        throw new Error('Video not found')
      }
      const data = await response.json()
      setVideo(data)
      
      // Calculate average watch percentage
      if (data.watchData.length > 0) {
        const avg = data.watchData.reduce((acc: number, w: any) => acc + w.watchPercentage, 0) / data.watchData.length
        setAverageWatchPercentage(Math.round(avg))
      }
    } catch (err) {
      setError('Failed to load video')
    } finally {
      setLoading(false)
    }
  }

  const trackView = async () => {
    if (viewTrackedRef.current) return
    viewTrackedRef.current = true

    try {
      await fetch('/api/analytics/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      })
      
      // Refresh video data to show updated view count
      fetchVideo()
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  const trackWatchProgress = async () => {
    if (!videoRef.current) return

    const currentTime = videoRef.current.currentTime
    const duration = videoRef.current.duration
    const percentage = Math.round((currentTime / duration) * 100)

    // Only track significant progress changes (every 10%)
    if (Math.abs(percentage - lastPercentageRef.current) >= 10) {
      lastPercentageRef.current = percentage

      try {
        await fetch('/api/analytics/watch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            videoId,
            watchPercentage: percentage,
            duration,
          }),
        })
      } catch (error) {
        console.error('Error tracking watch progress:', error)
      }
    }
  }

  const handlePlay = () => {
    trackView()
  }

  const handleTimeUpdate = () => {
    trackWatchProgress()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Loading video...</div>
      </div>
    )
  }

  if (error || !video) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error</h1>
          <p className="text-gray-600">{error || 'Video not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* Video Player */}
          <div className="relative bg-black">
            <video
              ref={videoRef}
              src={`/uploads/${video.filename}`}
              controls
              className="w-full"
              onPlay={handlePlay}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>

          {/* Video Info */}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              {video.name}
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* View Count */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Views</div>
                <div className="text-3xl font-bold text-blue-600">
                  {video.viewCount}
                </div>
              </div>

              {/* Average Watch Percentage */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Avg. Completion</div>
                <div className="text-3xl font-bold text-green-600">
                  {averageWatchPercentage}%
                </div>
              </div>

              {/* Upload Date */}
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">Uploaded</div>
                <div className="text-lg font-semibold text-purple-600">
                  {new Date(video.uploadedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Watch History */}
            {video.watchData.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  Watch Analytics
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 mb-2">
                    Total sessions: {video.watchData.length}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {video.watchData.slice(-10).reverse().map((data, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white p-2 rounded"
                      >
                        <span className="text-sm text-gray-600">
                          {new Date(data.timestamp).toLocaleString()}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                          {data.watchPercentage}% watched
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200"
          >
            Create Your Own Recording
          </a>
        </div>
      </div>
    </div>
  )
}

