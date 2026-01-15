import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'videos.json')

export interface VideoMetadata {
  id: string
  name: string
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

interface Database {
  videos: { [key: string]: VideoMetadata }
}

async function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    await mkdir(DATA_DIR, { recursive: true })
  }
}

async function readDatabase(): Promise<Database> {
  await ensureDataDir()
  
  if (!existsSync(DB_FILE)) {
    const initialDb: Database = { videos: {} }
    await writeFile(DB_FILE, JSON.stringify(initialDb, null, 2))
    return initialDb
  }

  const data = await readFile(DB_FILE, 'utf-8')
  return JSON.parse(data)
}

async function writeDatabase(db: Database): Promise<void> {
  await ensureDataDir()
  await writeFile(DB_FILE, JSON.stringify(db, null, 2))
}

export async function saveVideoMetadata(metadata: VideoMetadata): Promise<void> {
  const db = await readDatabase()
  db.videos[metadata.id] = metadata
  await writeDatabase(db)
}

export async function getVideoMetadata(videoId: string): Promise<VideoMetadata | null> {
  const db = await readDatabase()
  return db.videos[videoId] || null
}

export async function incrementViewCount(videoId: string): Promise<void> {
  const db = await readDatabase()
  if (db.videos[videoId]) {
    db.videos[videoId].viewCount += 1
    await writeDatabase(db)
  }
}

export async function saveWatchData(
  videoId: string,
  watchData: WatchData
): Promise<void> {
  const db = await readDatabase()
  if (db.videos[videoId]) {
    db.videos[videoId].watchData.push(watchData)
    await writeDatabase(db)
  }
}

export async function getAverageWatchPercentage(videoId: string): Promise<number> {
  const db = await readDatabase()
  const video = db.videos[videoId]
  
  if (!video || video.watchData.length === 0) {
    return 0
  }

  const sum = video.watchData.reduce((acc, data) => acc + data.watchPercentage, 0)
  return sum / video.watchData.length
}

export async function getAllVideos(): Promise<VideoMetadata[]> {
  const db = await readDatabase()
  return Object.values(db.videos).sort((a, b) => 
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  )
}

export async function updateVideoName(videoId: string, name: string): Promise<void> {
  const db = await readDatabase()
  if (db.videos[videoId]) {
    db.videos[videoId].name = name
    await writeDatabase(db)
  }
}

