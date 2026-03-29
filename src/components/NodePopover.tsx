'use client'

import { useEffect, useRef } from 'react'
import type { Node } from '@/types'
import type { CanvasSettings } from '@/lib/settings'

interface NodePopoverProps {
  node: Node
  transform: { x: number; y: number; k: number }
  settings: CanvasSettings
  onSave: (id: string, text: string) => Promise<string>
  onDelete: (id: string) => void
  onDiscard: (id: string) => void
  onClose: () => void
  onNodeCreateFromEdge: (sourceId: string, x: number, y: number) => void
  onNodeMove: (id: string, x: number, y: number) => void

}

export default function NodePopover({
  node,
  transform,
  settings,
  onSave,
  onDelete,
  onDiscard,
  onClose,
  onNodeCreateFromEdge,
  onNodeMove,
}: NodePopoverProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const screenX = node.x * transform.k + transform.x
  const screenY = node.y * transform.k + transform.y

  useEffect(() => {
    textareaRef.current?.focus()
  }, [node.id])

  function commit(fromBlur = false) {
    const text = textareaRef.current?.value ?? ''
    if (text.trim() === '' && node.text === null) {
      if (fromBlur) {
        onDiscard(node.id)
      } else {
        onDelete(node.id)
      }
    } else {
      onSave(node.id, text)
    }
    onClose()
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      commit(false)
    }
    if (e.key === 'Escape') {
      if (node.text === null) onDelete(node.id)
      onClose()
    }
    if (e.key === 'Tab' && e.shiftKey) {
      e.preventDefault()
      onNodeMove(node.id, node.x - settings.tabIndentX, node.y)
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      const text = textareaRef.current?.value ?? ''
      if (!text.trim()) {
        onNodeMove(node.id, node.x + settings.tabIndentX, node.y)
        return
      }
      const savedId = await onSave(node.id, text)
      onNodeCreateFromEdge(savedId, node.x + settings.tabIndentX, node.y + settings.tabIndentY)
      return
    }
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      const text = textareaRef.current?.value ?? ''
      if (!text.trim()) return
      const savedId = await onSave(node.id, text)
      onNodeCreateFromEdge(savedId, node.x, node.y + settings.shiftEnterIndentY)
      return
    }
  }

  function handleBlur() {
    commit(true)
  }

  return (
    <div
      className="absolute z-50 w-56 rounded-lg shadow-xl"
      style={{
        left: screenX + 16,
        top: screenY - 8,
        background: '#1e293b',
        border: '1px solid #334155',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <span className="text-xs text-slate-400 font-medium">Edit node</span>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200 text-sm leading-none"
          onMouseDown={(e) => e.preventDefault()}
        >
          ×
        </button>
      </div>
      <textarea
        key={node.id}
        ref={textareaRef}
        defaultValue={node.text ?? ''}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        rows={3}
        placeholder="Type something…"
        className="w-full bg-transparent px-3 py-1 text-sm text-slate-100 placeholder-slate-500 resize-none outline-none"
      />
      <div className="px-3 pb-2 pt-1">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onDelete(node.id)
            onClose()
          }}
          className="w-full rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-900/30 transition-colors"
        >
          Delete node
        </button>
      </div>
    </div>
  )
}