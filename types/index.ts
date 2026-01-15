// Video metadata types
export interface VideoMetadata {
  id: string
  filename: string
  uploadedAt: string
  viewCount: number
  watchData: WatchData[]
}

export interface WatchData {
  watchPercentage: number
  duration?: number
  timestamp: string
}

// API response types
export interface UploadResponse {
  videoId: string
  message: string
}

export interface VideoResponse extends VideoMetadata {}

export interface AnalyticsResponse {
  success: boolean
}

// Component prop types
export interface ScreenRecorderProps {
  onRecordingComplete: (blob: Blob) => void
}

export interface VideoTrimmerProps {
  videoBlob: Blob
  onTrimComplete: (blob: Blob) => void
}

export interface VideoUploaderProps {
  videoBlob: Blob
}


