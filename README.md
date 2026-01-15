# Screen Recorder MVP

A full-stack web application for recording, trimming, and sharing screen recordings with analytics tracking.

## Features

###  In-Browser Screen Recording
- Record screen and microphone audio using MediaRecorder API
- Start, pause, resume, and stop controls
- Real-time recording timer
- Saves output as `.webm` format

###  Video Trimming
- Trim video start and end times with interactive sliders
- Live preview of video content
- Client-side processing using FFmpeg.wasm (no server upload needed for trimming)
- Exports trimmed video in WebM format

###  Upload & Share
- Upload videos to local file storage (easily adaptable to S3/R2)
- Generate unique shareable links
- Copy link to clipboard functionality
- Embedded video player on public pages

###  Analytics
- Track view count per video
- Track watch completion percentage
- Session-based analytics
- Persistent storage using file-based JSON database

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Video Processing**: FFmpeg.wasm (client-side)
- **Recording**: MediaRecorder API
- **Storage**: File system (easily adaptable to cloud storage)
- **Database**: File-based JSON (production-ready for SQLite/PostgreSQL)

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- Modern browser with MediaRecorder API support (Chrome, Firefox, Edge)

### Installation

1. **Clone or navigate to the project directory**
   ```bash
   cd screen-recorder-mvp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000]

### Usage Flow

1. **Record**: Click "Start Recording" and select the screen/window to record
2. **Trim**: Use the sliders to set start/end times, then click "Trim Video"
3. **Upload**: Click "Upload Video" to save and generate a shareable link
4. **Share**: Copy the link and share it with others
5. **View Analytics**: Visit the shared link to see view count and completion stats

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── analytics/          # Analytics tracking endpoints
│   │   │   ├── view/           # View count tracking
│   │   │   └── watch/          # Watch percentage tracking
│   │   ├── upload/             # Video upload endpoint
│   │   └── video/[videoId]/    # Video metadata retrieval
│   ├── watch/[videoId]/        # Public video viewing page
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page (main recording interface)
├── components/
│   ├── ScreenRecorder.tsx      # Screen recording component
│   ├── VideoTrimmer.tsx        # Video trimming with FFmpeg.wasm
│   └── VideoUploader.tsx       # Video upload and share link generation
├── lib/
│   └── database.ts             # File-based database operations
├── public/
│   └── uploads/                # Uploaded video storage (generated)
├── data/
│   └── videos.json             # Database file (generated)
└── [config files]              # next.config.js, tailwind.config.js, etc.
```

## Architecture Decisions

### 1. **Client-Side Video Trimming (FFmpeg.wasm)**
   - **Why**: Reduces server load and bandwidth usage
   - **Trade-off**: Requires modern browser with WebAssembly support
   - **Benefit**: Faster processing for users with good hardware

### 2. **File-Based Storage**
   - **Why**: Simple, no external dependencies for MVP
   - **Trade-off**: Not scalable for production
   - **Easy Migration**: Structure is ready for S3/R2 integration

### 3. **File-Based JSON Database**
   - **Why**: Zero setup, perfect for MVP and development
   - **Trade-off**: Not suitable for high concurrency
   - **Easy Migration**: All database operations abstracted in `lib/database.ts`

### 4. **Next.js App Router**
   - **Why**: Modern, built-in API routes, excellent TypeScript support
   - **Benefit**: Single codebase for frontend and backend

### 5. **MediaRecorder API**
   - **Why**: Native browser API, no external dependencies
   - **Benefit**: Direct screen capture without plugins
   - **Format**: WebM with VP9 codec (widely supported)

### 6. **Real-Time Analytics Tracking**
   - **Why**: Provides immediate feedback on video performance
   - **Implementation**: Tracks at 10% intervals to balance granularity and API calls

## What Would Be Improved for Production

### Infrastructure & Scalability
1. **Cloud Storage Integration**
   - Migrate to AWS S3, Cloudflare R2, or similar
   - Implement CDN for video delivery
   - Add signed URLs for secure access

2. **Database Migration**
   - Replace JSON file with PostgreSQL or MongoDB
   - Add database indexes for performance
   - Implement connection pooling

3. **Authentication & Authorization**
   - Add user accounts and authentication (NextAuth.js)
   - Implement video ownership and permissions
   - Add private/public video settings

### Performance & Reliability
4. **Video Processing**
   - Move FFmpeg processing to server-side workers
   - Add job queue (BullMQ/Redis) for async processing
   - Support additional formats (MP4, AVI)
   - Add video compression and optimization

5. **Caching & Optimization**
   - Implement Redis for session and metadata caching
   - Add video thumbnail generation
   - Enable Next.js Image optimization for thumbnails

6. **Error Handling & Monitoring**
   - Add comprehensive error logging (Sentry)
   - Implement health checks and monitoring
   - Add retry logic for failed uploads
   - Better user-facing error messages

### Features & UX
7. **Enhanced Recording Features**
   - Add webcam overlay option
   - Support multiple audio sources
   - Add annotation tools
   - Implement real-time preview

8. **Advanced Trimming**
   - Frame-by-frame navigation
   - Multiple cut points
   - Add fade in/out effects
   - Support video filters

9. **Analytics Enhancement**
   - Heatmap of most-watched segments
   - Geographic viewer data
   - Device/browser statistics
   - Export analytics as CSV/PDF

10. **Sharing & Collaboration**
    - Password-protected videos
    - Expiration dates for shared links
    - Comments and reactions
    - Email notifications

### Security
11. **Security Improvements**
    - Add rate limiting (middleware)
    - Implement CSRF protection
    - Validate and sanitize all inputs
    - Add virus scanning for uploads
    - Implement content moderation

12. **Compliance**
    - Add GDPR compliance (data deletion, export)
    - Implement terms of service acceptance
    - Add privacy policy and cookie consent

### DevOps
13. **CI/CD Pipeline**
    - Automated testing (Jest, Playwright)
    - Automated deployments
    - Environment management (staging, production)

14. **Containerization**
    - Docker containers for consistent deployments
    - Kubernetes for orchestration
    - Separate services for recording, processing, serving

### Business Logic
15. **Monetization Features**
    - Storage quotas and paid tiers
    - Usage analytics and billing
    - Team/organization accounts

## Testing the Application

### Manual Testing Checklist
- [ ] Record a screen recording
- [ ] Pause and resume recording
- [ ] Stop recording and verify video playback
- [ ] Trim the video using sliders
- [ ] Upload the video
- [ ] Open the share link in a new tab/browser
- [ ] Verify view count increments
- [ ] Watch video to different percentages
- [ ] Check analytics display updates

## License

MIT

## Author

Built as an MVP demonstration project.


