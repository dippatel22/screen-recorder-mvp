'use client'

import { useState } from 'react'

interface VideoUploaderProps {
  videoBlob: Blob
  onUploadStart?: () => void
}

export default function VideoUploader({ videoBlob, onUploadStart }: VideoUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [shareLink, setShareLink] = useState<string>('')

  const uploadVideo = async () => {
    setIsUploading(true)
    
    if (onUploadStart) {
      onUploadStart()
    }

    try {
      const formData = new FormData()
      formData.append('video', videoBlob, 'recording.webm')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      const link = `${window.location.origin}/watch/${data.videoId}`
      setShareLink(link)
    } catch (error) {
      console.error('Error uploading video:', error)
      alert('Failed to upload video. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
    alert('Link copied to clipboard!')
  }

  return (
    <div className="space-y-4">
      {!shareLink ? (
        <button
          onClick={uploadVideo}
          disabled={isUploading}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
        >
          {isUploading ? 'Uploading...' : 'Upload Video'}
        </button>
      ) : (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-semibold mb-2">
               Video uploaded successfully!
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded bg-white text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition duration-200"
              >
                Copy
              </button>
            </div>
          </div>
          <a
            href={shareLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            View Shared Video
          </a>
        </div>
      )}
    </div>
  )
}

