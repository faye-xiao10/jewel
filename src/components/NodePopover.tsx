'use client'

import { useEffect, useRef, useState } from 'react'
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
  onSubtreeSelect: (id: string) => void
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
  onSubtreeSelect,
}: NodePopoverProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const uploadingRef = useRef(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'error'>('idle')

  const screenX = node.x * transform.k + transform.x
  const screenY = node.y * transform.k + transform.y

  useEffect(() => {
    textareaRef.current?.focus()
  }, [node.id])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    async function compressImage(file: File): Promise<Blob> {
      const bitmap = await createImageBitmap(file)
      const MAX_WIDTH = 1200
      const scale = bitmap.width > MAX_WIDTH ? MAX_WIDTH / bitmap.width : 1
      const w = Math.round(bitmap.width * scale)
      const h = Math.round(bitmap.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(bitmap, 0, 0, w, h)
      return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/webp', 0.85))
    }

    async function handlePaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items
      if (!items) return
      let handled = false
      for (const item of Array.from(items)) {
        if (!handled && item.type.startsWith('image/')) {
          handled = true
          e.preventDefault()
          const file = item.getAsFile()
          if (!file) return
          setUploadStatus('uploading')
          uploadingRef.current = true
          try {
            const compressed = await compressImage(file)
            const res = await fetch('/api/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'image/webp' },
              body: compressed,
            })
            const data = await res.json() as { url?: string; error?: string }
            if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed')
            if (textareaRef.current) textareaRef.current.value = data.url
            setUploadStatus('idle')
            await onSave(node.id, data.url)
            onClose()
          } catch {
            setUploadStatus('error')
            uploadingRef.current = false
          }
          return
        }
      }
    }

    textarea.addEventListener('paste', handlePaste)
    return () => textarea.removeEventListener('paste', handlePaste)
  }, [node.id, onSave, onClose])

  function commit(fromBlur = false) {
    if (uploadingRef.current) return
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

  function calcDynamicY(text: string): number {
    const lineCount = Math.ceil(text.length / settings.wrapLength)
    const lineHeight = settings.defaultSize
    return node.y + lineCount * lineHeight + settings.shiftEnterIndentY
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
    if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault()
      const dx = e.key === 'ArrowRight' ? settings.tabIndentX : e.key === 'ArrowLeft' ? -settings.tabIndentX : 0
      const dy = e.key === 'ArrowDown' ? settings.shiftEnterIndentY : e.key === 'ArrowUp' ? -settings.shiftEnterIndentY : 0
      onNodeMove(node.id, node.x + dx, node.y + dy)
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
      onNodeCreateFromEdge(savedId, node.x + settings.tabIndentX, calcDynamicY(text))
      return
    }
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      const text = textareaRef.current?.value ?? ''
      if (!text.trim()) return
      const savedId = await onSave(node.id, text)
      onNodeCreateFromEdge(savedId, node.x, calcDynamicY(text))
      return
    }
  }

  function handleBlur() {
    if (uploadingRef.current) return
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
      {uploadStatus === 'uploading' && (
        <p className="px-3 pb-1 text-xs text-slate-400">Uploading…</p>
      )}
      {uploadStatus === 'error' && (
        <p className="px-3 pb-1 text-xs text-red-400">Upload failed</p>
      )}
      <div className="flex px-1">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => { onSubtreeSelect(node.id); onClose() }}
          className="w-full rounded px-2 py-1 text-xs font-medium text-slate-400 hover:bg-slate-700 transition-colors mb-1"
        >
          Select subtree
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onDelete(node.id)
            onClose()
          }}
          className="w-full rounded px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-900/30 transition-colors mb-1"
        >
          Delete node
        </button>
      </div>
    </div>
  )
}