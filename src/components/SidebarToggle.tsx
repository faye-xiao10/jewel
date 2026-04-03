'use client'

import { useSidebar } from '@/context/SidebarContext'

export default function SidebarToggle() {
  const { toggle } = useSidebar()
  return (
    <button
      onClick={toggle}
      className="fixed top-4 left-4 z-50 flex items-center justify-center rounded"
      style={{
        width: 32,
        height: 32,
        background: '#0a1020',
        border: '1px solid #1e293b',
        color: '#64748b',
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8' }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#64748b' }}
      title="Toggle sidebar"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M3 2h7l3 3v9a1 1 0 01-1 1H3a1 1 0 01-1-1V3a1 1 0 011-1z"
          stroke="currentColor" strokeWidth="1.5"
        />
        <path d="M10 2v3h3" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </button>
  )
}
