import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Jewel',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" style={{ background: '#0f172a' }}>
      <body className="min-h-full">{children}</body>
    </html>
  )
}
