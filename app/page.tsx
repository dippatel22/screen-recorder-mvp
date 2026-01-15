'use client'

import { useState } from 'react'
import ScreenRecorder from '@/components/ScreenRecorder'
import VideoTrimmer from '@/components/VideoTrimmer'
import VideoUploader from '@/components/VideoUploader'
import VideoHistory from '@/components/VideoHistory'

export default function Home() {
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleRecordingStart = () => {
    // Reset all state when starting a new recording
    setRecordedBlob(null)
    setTrimmedBlob(null)
    setIsUploading(false)
  }

  const handleRecordingComplete = (blob: Blob) => {
    setRecordedBlob(blob)
    setIsUploading(false)
  }

  const handleUploadStart = () => {
    setIsUploading(true)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="flex">
        {/* Left Sidebar - Video History */}
        <VideoHistory />
        
        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
              Screen Recorder MVP
            </h1>
            
            <div className="space-y-6">
              {/* Step 1: Record */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                  1. Record Your Screen
                </h2>
                <ScreenRecorder 
                  onRecordingComplete={handleRecordingComplete}
                  onRecordingStart={handleRecordingStart}
                />
              </div>

          {/* Step 2: Trim (Optional) */}
          {recordedBlob && !isUploading && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-700">
                  2. Trim Your Video
                </h2>
                <span className="text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                  Optional - May Skip
                </span>
              </div>
              <VideoTrimmer 
                videoBlob={recordedBlob} 
                onTrimComplete={setTrimmedBlob}
              />
            </div>
          )}

              {/* Step 3: Upload & Share */}
              {(trimmedBlob || recordedBlob) && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                    3. Upload & Share
                  </h2>
                  <VideoUploader 
                    videoBlob={trimmedBlob || recordedBlob}
                    onUploadStart={handleUploadStart}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

