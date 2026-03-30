'use client'

import { useState, useEffect, useRef } from 'react'

interface SessionInfo {
  date: string
  color: string
}

export function SessionColorRow({ label, value, onConfirm }: {
  label: string
  value: string
  onConfirm: (v: string) => void
}) {
  const [pending, setPending] = useState(value)
  const dirty = pending !== value

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 shrink-0" style={{ width: '90px' }}>{label}</span>
      <input
        type="color"
        value={pending}
        onChange={(e) => setPending(e.target.value)}
        className="w-7 h-6 rounded cursor-pointer border-0 bg-transparent shrink-0"
      />
      <input
        type="text"
        value={pending}
        onChange={(e) => {
          const v = e.target.value
          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setPending(v)
        }}
        className="flex-1 text-xs text-slate-300 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 min-w-0"
        maxLength={7}
      />
      <button
        onClick={() => onConfirm(pending)}
        disabled={!dirty}
        className="text-xs px-1.5 py-0.5 rounded transition-colors shrink-0"
        style={{
          background: dirty ? '#6366f1' : '#1e293b',
          color: dirty ? '#fff' : '#475569',
          border: '1px solid',
          borderColor: dirty ? '#6366f1' : '#334155',
          cursor: dirty ? 'pointer' : 'default',
        }}
      >
        ✓
      </button>
    </div>
  )
}

export function PastSessionsDropdown({ sessions, formatDate, onConfirm }: {
  sessions: SessionInfo[]
  formatDate: (date: string) => string
  onConfirm: (date: string, color: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [dropPos, setDropPos] = useState({ top: 0, right: 0, width: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    function close() { setOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [open])

  function toggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setDropPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right, width: rect.width })
    setOpen(o => !o)
  }

  return (
    <div>
      <button
        ref={triggerRef}
        onClick={toggle}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
        style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
      >
        <span>Past sessions</span>
        <span
          style={{
            display: 'inline-block',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s',
          }}
        >
          ⌄
        </span>
      </button>
      {open && (
        <div
          className="rounded-lg shadow-xl overflow-y-auto"
          style={{
            position: 'fixed',
            top: dropPos.top,
            right: dropPos.right,
            width: dropPos.width,
            zIndex: 200,
            background: '#1e293b',
            border: '1px solid #334155',
            maxHeight: '240px',
            padding: '8px',
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="space-y-2">
            {sessions.map(s => (
              <SessionColorRow
                key={s.date}
                label={formatDate(s.date)}
                value={s.color}
                onConfirm={v => onConfirm(s.date, v)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
