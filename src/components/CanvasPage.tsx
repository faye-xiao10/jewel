'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Canvas from '@/components/Canvas'
import NodePopover from '@/components/NodePopover'
import SettingsPanel from '@/components/SettingsPanel'
import Sidebar from '@/components/Sidebar'
import SidebarToggle from '@/components/SidebarToggle'
import { findNearest } from '@/lib/nearest'
import { getSessionColor } from '@/lib/sessionColor'
import { useSettings } from '@/lib/settings'
import type { Node, Edge } from '@/types'
import { getSubtreeIds, subtreeToMarkdown, wouldFormCycle } from '@/lib/subtree'

interface TempMeta {
  explicitFromId?: string
  tempEdgeId?: string
}

function HintBar({ count, charCount, onCopy, onDetach }: { count: number; charCount: number; onCopy: () => void; onDetach?: () => void }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <div
      className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs text-slate-400"
      style={{ background: '#1e293b', border: '1px solid #334155' }}
    >
      <span>{count} node{count > 1 ? 's' : ''} selected · {charCount} chars · Press Delete to remove</span>
      <button
        onClick={handleCopy}
        className="px-3 py-1 rounded-full text-xs transition"
        style={{ background: 'rgba(255,255,255,0.1)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)' }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)' }}
      >
        {copied ? 'Copied!' : 'Copy Text'}
      </button>
      {onDetach && (
        <button
          onClick={onDetach}
          className="px-3 py-1 rounded-full text-xs transition"
          style={{ background: 'rgba(255,255,255,0.1)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)' }}
        >
          Detach
        </button>
      )}
    </div>
  )
}

function toNode(raw: Record<string, unknown>): Node {
  return {
    id: raw.id as string,
    canvasId: raw.canvasId as string,
    text: (raw.text as string | null) ?? null,
    url: (raw.url as string | null) ?? null,
    color: (raw.color as string | null) ?? undefined,
    x: raw.x as number,
    y: raw.y as number,
    createdAt: raw.createdAt as string,
    updatedAt: raw.updatedAt as string,
  }
}

function toEdge(raw: Record<string, unknown>): Edge {
  return {
    id: raw.id as string,
    canvasId: raw.canvasId as string,
    fromId: raw.fromId as string,
    toId: raw.toId as string,
    color: (raw.color as string | null) ?? undefined,
    createdAt: raw.createdAt as string,
  }
}

export default function CanvasPage({ canvasId }: { canvasId: string }) {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set())
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const [loading, setLoading] = useState(true)
  const [edgeError, setEdgeError] = useState<{ message: string; x: number; y: number } | null>(null)
  const sessionColorRef = useRef<string>('')
  const suppressNextCreateRef = useRef(false)
  const nodesRef = useRef<Node[]>([])
  nodesRef.current = nodes
  const tempMetaRef = useRef<Map<string, TempMeta>>(new Map())
  const discardedRef = useRef<Set<string>>(new Set())
  const { settings, updateSetting, resetSettings } = useSettings()

  useEffect(() => {
    sessionColorRef.current = getSessionColor()
  }, [])

  useEffect(() => {
    async function init() {
      const res = await fetch(`/api/canvases/${canvasId}`)
      if (res.ok) {
        const data = await res.json()
        setNodes(data.nodes.map(toNode))
        setEdges(data.edges.map(toEdge))
      } else {
        console.error('Failed to load canvas', canvasId, res.status)
      }
      setLoading(false)
    }
    init()
  }, [canvasId])

  const handleSubtreeSelect = useCallback((rootId: string) => {
    setSelectedNodeIds(getSubtreeIds(rootId, edges))
  }, [edges])

  const handleCopySubtree = useCallback(() => {
    if (selectedNodeIds.size === 0) return
    const rootId = [...selectedNodeIds].find(
      (id) => !edges.some((e) => e.toId === id && selectedNodeIds.has(e.fromId))
    )
    if (!rootId) return
    const markdown = subtreeToMarkdown(nodes, edges, selectedNodeIds, rootId)
    navigator.clipboard.writeText(markdown)
  }, [nodes, edges, selectedNodeIds])

  const showEdgeError = useCallback((message: string, nodeId: string) => {
    const node = nodesRef.current.find((n) => n.id === nodeId)
    if (!node) return
    const x = node.x * transform.k + transform.x
    const y = node.y * transform.k + transform.y
    setEdgeError({ message, x, y })
    setTimeout(() => setEdgeError(null), 2000)
  }, [transform])

  const onEdgeCreate = useCallback(async (sourceId: string, targetId: string) => {
    const alreadyHasParent = edges.some((e) => e.toId === targetId)
    if (alreadyHasParent) { showEdgeError('Already has a parent', targetId); return }
    if (wouldFormCycle(sourceId, targetId, edges)) { showEdgeError('Would create a cycle', targetId); return }
    const now = new Date().toISOString()
    const tempEdgeId = `temp_edge_${Date.now()}`
    const color = sessionColorRef.current || undefined
    const tempEdge: Edge = { id: tempEdgeId, canvasId, fromId: sourceId, toId: targetId, color, createdAt: now }
    setEdges((prev) => [...prev, tempEdge])
    try {
      const res = await fetch('/api/edges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canvasId, fromId: sourceId, toId: targetId, color: sessionColorRef.current || null }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const realEdge = toEdge(await res.json())
      setEdges((prev) => prev.map((e) => e.id === tempEdgeId ? realEdge : e))
    } catch {
      setEdges((prev) => prev.filter((e) => e.id !== tempEdgeId))
    }
  }, [canvasId, edges, showEdgeError])

  const onDetach = useCallback(() => {
    const rootId = [...selectedNodeIds].find(
      (id) => !edges.some((e) => e.toId === id && selectedNodeIds.has(e.fromId))
    )
    if (!rootId) return
    const parentEdge = edges.find((e) => e.toId === rootId)
    if (!parentEdge) return
    setEdges((prev) => prev.filter((e) => e.id !== parentEdge.id))
    if (!parentEdge.id.startsWith('temp_')) {
      fetch(`/api/edges/${parentEdge.id}`, { method: 'DELETE' })
    }
    setSelectedNodeIds(new Set())
  }, [selectedNodeIds, edges])

  const onNodeCreate = useCallback((x: number, y: number) => {
    if (suppressNextCreateRef.current) { suppressNextCreateRef.current = false; return }
    const now = new Date().toISOString()
    const tempId = `temp_${Date.now()}`
    const color = sessionColorRef.current || undefined
    const tempNode: Node = { id: tempId, canvasId, text: null, url: null, color, x, y, createdAt: now, updatedAt: now }
    const nearest = findNearest(nodesRef.current.filter(n => !n.id.startsWith('temp_')), x, y)
    if (nearest) {
      const tempEdgeId = `temp_edge_${Date.now()}`
      tempMetaRef.current.set(tempId, { tempEdgeId })
      const tempEdge: Edge = { id: tempEdgeId, canvasId, fromId: nearest.id, toId: tempId, color, createdAt: now }
      setEdges((e) => [...e, tempEdge])
    } else {
      tempMetaRef.current.set(tempId, {})
    }
    setNodes((prev) => [...prev, tempNode])
    setSelectedNode(tempNode)
    setSelectedNodeIds(new Set())
  }, [canvasId])

  const onNodeCreateFromEdge = useCallback((sourceId: string, x: number, y: number) => {
    const now = new Date().toISOString()
    const tempId = `temp_${Date.now()}`
    const tempEdgeId = `temp_edge_${Date.now()}`
    const color = sessionColorRef.current || undefined
    const tempNode: Node = { id: tempId, canvasId, text: null, url: null, color, x, y, createdAt: now, updatedAt: now }
    const tempEdge: Edge = { id: tempEdgeId, canvasId, fromId: sourceId, toId: tempId, color, createdAt: now }
    tempMetaRef.current.set(tempId, { explicitFromId: sourceId, tempEdgeId })
    setNodes((prev) => [...prev, tempNode])
    setEdges((prev) => [...prev, tempEdge])
    setSelectedNode(tempNode)
    setSelectedNodeIds(new Set())
  }, [canvasId])

  const onNodeMove = useCallback(async (id: string, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, x, y, updatedAt: new Date().toISOString() } : n)))
    if (id.startsWith('temp_')) return
    await fetch(`/api/nodes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x, y }),
    })
  }, [])

  const onNodeMoveMulti = useCallback(async (deltas: { id: string; x: number; y: number }[]) => {
    setNodes((prev) => {
      const map = new Map(deltas.map((d) => [d.id, d]))
      return prev.map((n) => { const delta = map.get(n.id); return delta ? { ...n, x: delta.x, y: delta.y, updatedAt: new Date().toISOString() } : n })
    })
    await Promise.all(
      deltas.filter((d) => !d.id.startsWith('temp_')).map((d) =>
        fetch(`/api/nodes/${d.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ x: d.x, y: d.y }),
        })
      )
    )
  }, [])

  const onNodeSelect = useCallback((node: Node) => { setSelectedNode(node) }, [])

  const onNodeMultiSelect = useCallback((id: string, addToSelection: boolean) => {
    setSelectedNodeIds((prev) => {
      const next = new Set(prev)
      if (addToSelection) { if (next.has(id)) next.delete(id); else next.add(id) }
      else { next.clear(); next.add(id) }
      return next
    })
  }, [])

  const onClearSelection = useCallback(() => { setSelectedNodeIds(new Set()) }, [])

  const onSave = useCallback(async (id: string, text: string): Promise<string> => {
    if (discardedRef.current.has(id)) { discardedRef.current.delete(id); return id }
    suppressNextCreateRef.current = true
    setTimeout(() => { suppressNextCreateRef.current = false }, 300)

    if (id.startsWith('temp_')) {
      const node = nodesRef.current.find((n) => n.id === id)
      if (!node) return id
      const meta = tempMetaRef.current.get(id) ?? {}
      try {
        const sessionColor = sessionColorRef.current || undefined
        const res = await fetch('/api/nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            canvasId,
            x: node.x,
            y: node.y,
            text: text.trim() || null,
            color: sessionColor ?? null,
            edgeColor: sessionColor ?? null,
            ...(meta.explicitFromId ? { explicitFromId: meta.explicitFromId } : {}),
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const { node: realNode, edge: realEdge } = await res.json()
        const saved = toNode(realNode)
        const savedEdge = realEdge ? toEdge(realEdge) : null
        setNodes((prev) => prev.map((n) => (n.id === id ? saved : n)))
        setEdges((prev) => {
          const without = meta.tempEdgeId ? prev.filter((e) => e.id !== meta.tempEdgeId) : prev
          return savedEdge ? [...without, savedEdge] : without
        })
        tempMetaRef.current.delete(id)
        return saved.id
      } catch {
        return id
      }
    }

    setNodes((prev) =>
      prev.map((n) => n.id === id ? { ...n, text: text || null, updatedAt: new Date().toISOString() } : n)
    )
    await fetch(`/api/nodes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim() || null }),
    })
    return id
  }, [canvasId])

  const onDelete = useCallback(async (id: string) => {
    const snapshot = { nodes: [] as Node[], edges: [] as Edge[] }
    setNodes((prev) => { snapshot.nodes = prev; return prev.filter((n) => n.id !== id) })
    setEdges((prev) => { snapshot.edges = prev; return prev.filter((e) => e.fromId !== id && e.toId !== id) })
    setSelectedNode(null)
    setSelectedNodeIds((prev) => { const next = new Set(prev); next.delete(id); return next })
    tempMetaRef.current.delete(id)
    if (!id.startsWith('temp_')) {
      try {
        const res = await fetch(`/api/nodes/${id}`, { method: 'DELETE' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
      } catch {
        setNodes(snapshot.nodes)
        setEdges(snapshot.edges)
      }
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Delete' && e.key !== 'Backspace') return
      if (selectedNodeIds.size === 0) return
      if (document.activeElement?.tagName === 'TEXTAREA') return
      e.preventDefault()
      selectedNodeIds.forEach((id) => onDelete(id))
      setSelectedNodeIds(new Set())
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedNodeIds, onDelete])

  const onSessionColorChange = useCallback((date: string, color: string) => {
    const today = new Date().toLocaleDateString('en-CA')
    if (date === today) {
      localStorage.setItem('jewel_session_color', JSON.stringify({ date: today, color }))
      sessionColorRef.current = color
    }
    setNodes(prev => prev.map(n => n.createdAt.startsWith(date) ? { ...n, color } : n))
    setEdges(prev => prev.map(e => e.createdAt.startsWith(date) ? { ...e, color } : e))
  }, [])

  const onDiscard = useCallback((id: string) => {
    discardedRef.current.add(id)
    const meta = tempMetaRef.current.get(id)
    setNodes((prev) => prev.filter((n) => n.id !== id))
    setEdges((prev) => {
      if (meta?.tempEdgeId) return prev.filter((e) => e.id !== meta.tempEdgeId)
      return prev.filter((e) => e.fromId !== id && e.toId !== id)
    })
    setSelectedNode(null)
    tempMetaRef.current.delete(id)
    suppressNextCreateRef.current = true
    setTimeout(() => { suppressNextCreateRef.current = false }, 300)
    if (!id.startsWith('temp_')) {
      fetch(`/api/nodes/${id}`, { method: 'DELETE' })
    }
  }, [])

  const selectedNodeCurrent = selectedNode ? nodes.find((n) => n.id === selectedNode.id) ?? null : null

  return (
    <div className="flex w-full h-screen overflow-hidden" style={{ background: '#0f172a' }}>
      <Sidebar />
      <SidebarToggle />
      <div className="relative flex-1 h-screen overflow-hidden">
        {loading ? (
          <div className="flex w-full h-full items-center justify-center">
            <span className="text-slate-500 text-sm">Loading…</span>
          </div>
        ) : (
          <>
            <Canvas
              nodes={nodes}
              edges={edges}
              settings={settings}
              selectedNodeIds={selectedNodeIds}
              sessionColor={sessionColorRef.current}
              onNodeCreate={onNodeCreate}
              onNodeCreateFromEdge={onNodeCreateFromEdge}
              onEdgeCreate={onEdgeCreate}
              onNodeMove={onNodeMove}
              onNodeMoveMulti={onNodeMoveMulti}
              onNodeSelect={onNodeSelect}
              onNodeMultiSelect={onNodeMultiSelect}
              onClearSelection={onClearSelection}
              onTransformChange={setTransform}
              onSubtreeSelect={handleSubtreeSelect}
              onCopySubtree={handleCopySubtree}
            />
            {selectedNodeCurrent && (
              <NodePopover
                node={selectedNodeCurrent}
                transform={transform}
                onSave={onSave}
                onDelete={onDelete}
                onDiscard={onDiscard}
                onClose={() => setSelectedNode(null)}
                onNodeCreateFromEdge={onNodeCreateFromEdge}
                settings={settings}
                onNodeMove={onNodeMove}
                onSubtreeSelect={handleSubtreeSelect}
              />
            )}
            {selectedNodeIds.size > 0 && (
              <HintBar
                count={selectedNodeIds.size}
                charCount={nodes.filter((n) => selectedNodeIds.has(n.id)).reduce((sum, n) => sum + (n.text ?? '').length, 0)}
                onCopy={handleCopySubtree}
                onDetach={onDetach}
              />
            )}
            <SettingsPanel
              settings={settings}
              onUpdate={updateSetting}
              onReset={resetSettings}
              canvasId={canvasId}
              onSessionColorChange={onSessionColorChange}
            />
            {edgeError && (
              <div
                className="absolute z-50 px-2 py-1 rounded text-xs text-white pointer-events-none"
                style={{ background: 'rgba(239,68,68,0.85)', left: edgeError.x + 12, top: edgeError.y - 24, transform: 'translateY(-50%)' }}
              >
                {edgeError.message}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}