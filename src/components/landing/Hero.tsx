'use client'

import { signIn } from 'next-auth/react'

export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center">
      <div className="mb-6 flex items-center gap-2">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polygon points="16,2 30,10 30,22 16,30 2,22 2,10" fill="url(#gem)" stroke="rgba(139,92,246,0.5)" strokeWidth="1" />
          <polygon points="16,2 30,10 16,14" fill="rgba(167,139,250,0.4)" />
          <polygon points="2,10 16,14 16,30" fill="rgba(109,40,217,0.4)" />
          <polygon points="30,10 16,14 16,30" fill="rgba(139,92,246,0.3)" />
          <defs>
            <linearGradient id="gem" x1="2" y1="2" x2="30" y2="30">
              <stop offset="0%" stopColor="#a78bfa" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
        </svg>
        <span className="text-2xl font-bold tracking-tight" style={{ color: '#e2e8f0' }}>Jewel</span>
      </div>

      <h1
        className="text-5xl font-bold leading-tight mb-4 max-w-2xl"
        style={{ color: '#f1f5f9', letterSpacing: '-0.02em' }}
      >
        Map the shape of your thinking.
      </h1>

      <p className="text-lg mb-10 max-w-xl" style={{ color: '#64748b', lineHeight: '1.7' }}>
        An infinite canvas where ideas connect. No folders, no hierarchy — just thoughts and the edges between them.
      </p>

      <button
        onClick={() => signIn('google', { callbackUrl: '/api/auth/post-signin' })}
        className="flex items-center gap-3 px-6 py-3 rounded-xl text-sm font-semibold transition-all"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          color: '#f5f3ff',
          boxShadow: '0 0 24px rgba(124,58,237,0.3)',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 32px rgba(124,58,237,0.5)'
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 24px rgba(124,58,237,0.3)'
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
          <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        Sign in with Google
      </button>
    </section>
  )
}
