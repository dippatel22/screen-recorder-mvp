'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Video {
  id: string
  name: string
  filename: string
  uploadedAt: string
  viewCount: number
  watchData: Array<{
    watchPercentage: number
    timestamp: string
  }>
}

export default function VideoHistory() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchVideos()
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchVideos, 10000)
    return () => clearInterval(interval)
  }, [])

  const fetchVideos = async () => {
    try {
      const response = await fetch('/api/videos/list')
      if (response.ok) {
        const data = await response.json()
        setVideos(data.videos || [])
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (video: Video) => {
    setEditingId(video.id)
    setEditName(video.name)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
  }

  const saveEdit = async (videoId: string) => {
    if (!editName.trim()) {
      alert('Video name cannot be empty')
      return
    }

    try {
      const response = await fetch(`/api/videos/${videoId}/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })

      if (response.ok) {
        await fetchVideos()
        setEditingId(null)
        setEditName('')
      } else {
        alert('Failed to update video name')
      }
    } catch (error) {
      console.error('Error updating video name:', error)
      alert('Failed to update video name')
    }
  }

  const openVideo = (videoId: string) => {
    window.open(`/watch/${videoId}`, '_blank')
  }

  const getAverageCompletion = (video: Video) => {
    if (!video.watchData || video.watchData.length === 0) return 0
    const sum = video.watchData.reduce((acc, data) => acc + data.watchPercentage, 0)
    return Math.round(sum / video.watchData.length)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="w-80 bg-white shadow-xl h-screen overflow-y-auto border-r border-gray-200">
      <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
        <h2 className="text-xl font-bold text-gray-800 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Video History
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          {videos.length} video{videos.length !== 1 ? 's' : ''} uploaded
        </p>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading videos...</p>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 mt-4">No videos yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Record and upload your first video!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition duration-200 border border-gray-200"
              >
                {/* Video Name */}
                {editingId === video.id ? (
                  <div className="mb-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit(video.id)
                        if (e.key === 'Escape') cancelEdit()
                      }}
                    />
                    <div className="flex space-x-1 mt-1">
                      <button
                        onClick={() => saveEdit(video.id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 px-2 rounded"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex-1 bg-gray-500 hover:bg-gray-600 text-white text-xs py-1 px-2 rounded"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 text-sm flex-1 line-clamp-2">
                      {video.name}
                    </h3>
                    <button
                      onClick={() => startEdit(video)}
                      className="text-gray-400 hover:text-blue-600 ml-2"
                      title="Edit name"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  <div className="bg-white rounded p-2">
                    <div className="text-gray-500">Views</div>
                    <div className="font-bold text-blue-600">{video.viewCount}</div>
                  </div>
                  <div className="bg-white rounded p-2">
                    <div className="text-gray-500">Completion</div>
                    <div className="font-bold text-green-600">{getAverageCompletion(video)}%</div>
                  </div>
                </div>

                {/* Date */}
                <p className="text-xs text-gray-500 mb-2">
                  {formatDate(video.uploadedAt)}
                </p>

                {/* Actions */}
                <button
                  onClick={() => openVideo(video.id)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 px-3 rounded transition duration-200 flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View & Analytics
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


