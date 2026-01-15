'use client'

import { useState, useRef, useEffect } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile, toBlobURL } from '@ffmpeg/util'

interface VideoTrimmerProps {
  videoBlob: Blob
  onTrimComplete: (blob: Blob) => void
}

export default function VideoTrimmer({ videoBlob, onTrimComplete }: VideoTrimmerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [ffmpegLoaded, setFfmpegLoaded] = useState(false)
  const [duration, setDuration] = useState(0)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [loadingProgress, setLoadingProgress] = useState(0)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const ffmpegRef = useRef<FFmpeg | null>(null)

  useEffect(() => {
    // Create URL for preview
    const url = URL.createObjectURL(videoBlob)
    setVideoUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [videoBlob])

  useEffect(() => {
    loadFFmpeg()
  }, [])

  const loadFFmpeg = async () => {
    try {
      console.log('Initializing FFmpeg...')
      const ffmpeg = new FFmpeg()
      
      ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg:', message)
      })

      ffmpeg.on('progress', ({ progress }) => {
        const percentage = Math.round(progress * 100)
        setLoadingProgress(percentage)
        console.log(`Progress: ${percentage}%`)
      })
      
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
      
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      })
      
      ffmpegRef.current = ffmpeg
      setFfmpegLoaded(true)
      console.log('✓ FFmpeg loaded and ready')
    } catch (error) {
      console.error('Failed to load FFmpeg:', error)
      alert('Failed to load video processor. Please refresh the page.')
    }
  }

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const dur = videoRef.current.duration
      setDuration(dur)
      setEndTime(dur)
    }
  }

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime
      setCurrentTime(time)
      
      // Keep playback within selected range
      if (time < startTime) {
        videoRef.current.currentTime = startTime
      }
      if (time > endTime) {
        videoRef.current.currentTime = startTime // Loop to start
      }
    }
  }

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
    }
  }

  const trimVideo = async () => {
    if (!ffmpegLoaded || !ffmpegRef.current) {
      alert('FFmpeg is not loaded yet. Please wait.')
      return
    }

    if (startTime >= endTime) {
      alert('Start time must be before end time')
      return
    }

    if (endTime - startTime < 0.5) {
      alert('Trim duration must be at least 0.5 seconds')
      return
    }

    // Check file size BEFORE attempting to process
    const fileSizeMB = videoBlob.size / (1024 * 1024)
    console.log(`Video size: ${fileSizeMB.toFixed(2)} MB`)
    
    if (fileSizeMB > 100) {
      const proceed = confirm(
        `Large Video Detected (${fileSizeMB.toFixed(0)} MB)\n\n` +
        `Browser trimming may fail due to memory limits.\n\n` +
        `Continue anyway?`
      )
      if (!proceed) return
    }

    setIsLoading(true)
    setLoadingProgress(0)

    const trimDuration = endTime - startTime

    try {
      const ffmpeg = ffmpegRef.current
      console.log('=== Trim Start ===')
      console.log(`Trim: ${startTime.toFixed(2)}s to ${endTime.toFixed(2)}s (duration: ${trimDuration.toFixed(2)}s)`)
      
      // Step 1: Clean up old files
      console.log('Cleaning...')
      try {
        await ffmpeg.deleteFile('input.webm')
        await ffmpeg.deleteFile('output.webm')
      } catch (e) { /* ignore */ }

      // Step 2: Write input file
      console.log('Writing input...')
      let inputData = await fetchFile(videoBlob)
      await ffmpeg.writeFile('input.webm', new Uint8Array(inputData))
      inputData = null as any // Free memory immediately
      console.log('✓ Input written')

      // Step 3: Execute trim with memory-safe settings
      console.log('Trimming...')
      await ffmpeg.exec([
        '-i', 'input.webm',
        '-ss', startTime.toFixed(2),
        '-t', trimDuration.toFixed(2),
        '-c:v', 'libvpx',           // Use VP8 for better compatibility
        '-b:v', '500k',             // Lower bitrate to reduce memory
        '-cpu-used', '8',           // Fastest encoding (less memory)
        '-deadline', 'realtime',    // Real-time mode
        '-row-mt', '1',             // Row-based multithreading
        '-y',
        'output.webm'
      ])
      console.log('✓ Trim complete')

      // Step 4: Read output
      console.log('Reading output...')
      const data = await ffmpeg.readFile('output.webm') as Uint8Array
      
      if (!data || data.length === 0) {
        throw new Error('Output is empty')
      }
      
      console.log(`✓ Output: ${data.length} bytes`)

      // Step 5: Create blob (copy to clean Uint8Array)
      const cleanData = new Uint8Array(data.length)
      cleanData.set(data)
      const trimmedBlob = new Blob([cleanData], { type: 'video/webm' })

      if (trimmedBlob.size === 0) {
        throw new Error('Blob is empty')
      }

      console.log(`✓ Success: ${videoBlob.size} → ${trimmedBlob.size} bytes`)

      // Step 6: Cleanup
      try {
        await ffmpeg.deleteFile('input.webm')
        await ffmpeg.deleteFile('output.webm')
      } catch (e) { /* ignore */ }

      onTrimComplete(trimmedBlob)
      alert('✓ Video trimmed successfully!')

    } catch (error) {
      console.error('Trim error:', error)
      
      let errorMsg = 'Unknown error'
      let suggestion = ''
      
      if (error instanceof Error) {
        errorMsg = error.message
        
        if (error.message.includes('memory') || error.message.includes('out of bounds')) {
          suggestion = '\n\n Your video may be too large for browser memory.\n\n' +
                      'Try trimming a shorter duration or refresh the page.'
        } else {
          suggestion = '\n\n Please try again or refresh the page.'
        }
      }
      
      alert(`Trimming failed: ${errorMsg}${suggestion}`)
    } finally {
      setIsLoading(false)
      setLoadingProgress(0)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {/* FFmpeg Loading Status */}
      {!ffmpegLoaded && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-sm text-blue-800">Loading video processor...</span>
          </div>
        </div>
      )}

      {/* Video Preview */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          className="w-full"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
        />
      </div>

      {duration > 0 && ffmpegLoaded && (
        <>
          {/* Timeline Info */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Start: {formatTime(startTime)}</span>
              <span>Current: {formatTime(currentTime)}</span>
              <span>End: {formatTime(endTime)}</span>
            </div>

            {/* Start Time Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time: {formatTime(startTime)}
              </label>
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={startTime}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  setStartTime(Math.min(value, endTime - 0.5))
                  handleSeek(value)
                }}
                className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                disabled={isLoading}
              />
            </div>

            {/* End Time Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time: {formatTime(endTime)}
              </label>
              <input
                type="range"
                min="0"
                max={duration}
                step="0.1"
                value={endTime}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  setEndTime(Math.max(value, startTime + 0.5))
                  handleSeek(value)
                }}
                className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                disabled={isLoading}
              />
            </div>

            {/* Trim Info */}
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <div className="text-sm text-gray-600">
                Trimmed duration: <span className="font-semibold text-gray-900">{formatTime(endTime - startTime)}</span>
              </div>
            </div>
          </div>

          {/* Trim Button */}
          <button
            onClick={trimVideo}
            disabled={isLoading || startTime >= endTime}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing... {loadingProgress > 0 && `${loadingProgress}%`}
              </span>
            ) : (
              'Trim Video'
            )}
          </button>
        </>
      )}
    </div>
  )
}
