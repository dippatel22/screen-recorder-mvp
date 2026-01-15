'use client'

import { useState, useRef } from 'react'

interface ScreenRecorderProps {
  onRecordingComplete: (blob: Blob) => void
  onRecordingStart?: () => void
}

export default function ScreenRecorder({ onRecordingComplete, onRecordingStart }: ScreenRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const startRecording = async () => {
    try {
      // Notify parent component that recording is starting
      if (onRecordingStart) {
        onRecordingStart()
      }

      // Request screen capture
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' as any },
        audio: true,
      })

      // Request microphone
      let audioStream: MediaStream | null = null
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (err) {
        console.log('Microphone access denied, continuing without mic')
      }

      // Combine streams
      const tracks = [
        ...displayStream.getVideoTracks(),
        ...displayStream.getAudioTracks(),
      ]
      
      if (audioStream) {
        tracks.push(...audioStream.getAudioTracks())
      }

      const combinedStream = new MediaStream(tracks)
      streamRef.current = combinedStream

      // Handle when user stops sharing from browser controls
      displayStream.getVideoTracks()[0].addEventListener('ended', () => {
        console.log('User stopped sharing screen')
        stopRecording()
      })

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9',
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' })
        onRecordingComplete(blob)
        
        // Clean up
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
        if (timerRef.current) {
          clearInterval(timerRef.current)
        }
        setRecordingTime(0)
      }

      mediaRecorder.start(1000) // Collect data every second
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Failed to start recording. Please ensure you grant screen capture permissions.')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      {!isRecording ? (
        <button
          onClick={startRecording}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
        >
          Start Recording
        </button>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-4 bg-gray-100 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}></div>
              <span className="font-mono text-xl">{formatTime(recordingTime)}</span>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {!isPaused ? (
              <button
                onClick={pauseRecording}
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                Pause
              </button>
            ) : (
              <button
                onClick={resumeRecording}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
              >
                Resume
              </button>
            )}
            <button
              onClick={stopRecording}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              Stop Recording
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

