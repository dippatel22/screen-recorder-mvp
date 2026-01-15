import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Screen Recorder MVP',
  description: 'Record, trim, and share your screen recordings',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}


