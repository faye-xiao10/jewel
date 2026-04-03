'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import SidebarItem from './SidebarItem'
import { useSidebar } from '@/context/SidebarContext'

interface Canvas {
  id: string
  name: string
  updatedAt: string
}

export default function Sidebar() {
  const { isOpen } = useSidebar()
  const pathname = usePathname()
  const currentCanvasId = pathname.split('/').pop() ?? ''
  const [canvases, setCanvases] = useState<Canvas[]>([])
  const router = useRouter()

  const fetchCanvases = useCallback(async () => {
    try {
      const res = await fetch('/api/canvases')
      if (!res.ok) return
      const data = await res.json()
      return data.sort((a: Canvas, b: Canvas) => b.updatedAt.localeCompare(a.updatedAt)) as Canvas[]
    } catch (error) {
      console.error('Failed to load canvases', error)
      return undefined
    }
  }, [])

  useEffect(() => {
    fetchCanvases().then((data) => {
      if (data) setCanvases(data)
    })
  }, [fetchCanvases])

  async function handleNew() {
    try {
      const res = await fetch('/api/canvases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Untitled Canvas' }),
      })
      if (!res.ok) return
      const data = await res.json()
      setCanvases((prev) => [{ id: data.id, name: data.name, updatedAt: data.updatedAt }, ...prev])
      router.push(`/canvas/${data.id}`)
    } catch (error) {
      console.error('Failed to create canvas', error)
    }
  }

  async function handleRename(id: string, name: string) {
    try {
      const res = await fetch(`/api/canvases/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) return
      setCanvases((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)))
    } catch (error) {
      console.error('Failed to rename canvas', error)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/canvases/${id}`, { method: 'DELETE' })
      if (!res.ok) return
      setCanvases((prev) => prev.filter((c) => c.id !== id))
      if (id === currentCanvasId) {
        const remaining = canvases.filter((c) => c.id !== id)
        if (remaining.length > 0) {
          router.push(`/canvas/${remaining[0].id}`)
        } else {
          router.push('/api/auth/post-signin')
        }
      }
    } catch (error) {
      console.error('Failed to delete canvas', error)
    }
  }

  return (
    <motion.div
      animate={{ width: isOpen ? 260 : 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="overflow-hidden shrink-0 h-full"
    >
      <div
        className="flex flex-col h-full py-3 px-2 gap-1"
        style={{ width: 260, background: '#0a1020', borderRight: '1px solid #1e293b' }}
      >
        <div className="flex items-center justify-between px-2 mb-2 pt-8">
          <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#475569' }}>
            Canvases
          </span>
          <button
            onClick={handleNew}
            className="text-xs px-2 py-1 rounded transition"
            style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}
            title="New canvas"
          >
            + New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 min-h-0">
          {canvases.map((canvas) => (
            <SidebarItem
              key={canvas.id}
              id={canvas.id}
              name={canvas.name}
              isActive={canvas.id === currentCanvasId}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}
        </div>

        <div className="pt-2 mt-auto border-t" style={{ borderColor: '#1e293b' }}>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full text-left px-3 py-2 rounded text-xs transition"
            style={{ color: '#475569' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#475569' }}
          >
            Sign out
          </button>
        </div>
      </div>
    </motion.div>
  )
}