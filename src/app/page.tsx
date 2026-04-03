import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import Hero from '@/components/landing/Hero'
import FeaturesGrid from '@/components/landing/FeaturesGrid'

export default async function LandingPage() {
  const session = await auth()
  if (session?.user?.id) redirect('/api/auth/post-signin')

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080f1e', color: '#e2e8f0' }}>
      <nav className="flex items-center justify-between px-8 py-5" style={{ borderBottom: '1px solid #0f1e36' }}>
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <polygon points="16,2 30,10 30,22 16,30 2,22 2,10" fill="url(#gem-nav)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
            <polygon points="16,2 30,10 16,14" fill="rgba(167,139,250,0.35)" />
            <polygon points="2,10 16,14 16,30" fill="rgba(109,40,217,0.35)" />
            <polygon points="30,10 16,14 16,30" fill="rgba(139,92,246,0.25)" />
            <defs>
              <linearGradient id="gem-nav" x1="2" y1="2" x2="30" y2="30">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
          </svg>
          <span className="text-base font-semibold tracking-tight" style={{ color: '#e2e8f0' }}>Jewel</span>
        </div>
      </nav>

      <main className="flex flex-col items-center flex-1">
        <Hero />
        <FeaturesGrid />
      </main>

      <footer className="text-center py-8 text-xs" style={{ color: '#1e3a5f', borderTop: '1px solid #0f1e36' }}>
        <span className="font-semibold" style={{ color: '#334155' }}>Jewel</span>
        <span className="mx-2" style={{ color: '#1e293b' }}>·</span>
        <span>Thinking, mapped.</span>
      </footer>
    </div>
  )
}
