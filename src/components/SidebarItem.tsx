'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface Props {
  id: string
  name: string
  isActive: boolean
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export default function SidebarItem({ id, name, isActive, onRename, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function handleDoubleClick() {
    setEditing(true)
  }

  function handleBlur() {
    setEditing(false)
    const trimmed = value.trim()
    if (trimmed && trimmed !== name) {
      onRename(id, trimmed)
    } else {
      setValue(name)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') inputRef.current?.blur()
    if (e.key === 'Escape') { setValue(name); setEditing(false) }
  }

  function handleDeleteClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (confirmDelete) {
      onDelete(id)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 2500)
    }
  }

  return (
    <div
      className="group relative flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer text-sm transition-colors"
      style={{
        background: isActive ? 'rgba(139,92,246,0.15)' : 'transparent',
        border: isActive ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent',
        color: isActive ? '#c4b5fd' : '#94a3b8',
      }}
      onDoubleClick={handleDoubleClick}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent outline-none text-sm min-w-0"
          style={{ color: '#e2e8f0' }}
        />
      ) : (
        <Link href={`/canvas/${id}`} className="flex-1 truncate min-w-0">
          {name}
        </Link>
      )}
      <button
        onClick={handleDeleteClick}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-xs px-1.5 py-0.5 rounded transition-all"
        style={{
          background: confirmDelete ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)',
          color: confirmDelete ? '#fca5a5' : '#64748b',
        }}
        title={confirmDelete ? 'Click again to confirm' : 'Delete canvas'}
      >
        {confirmDelete ? 'Sure?' : '×'}
      </button>
    </div>
  )
}
