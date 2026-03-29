'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Canvas from '@/components/Canvas'
import NodePopover from '@/components/NodePopover'
import { findNearest } from '@/lib/nearest'
import type { Node, Edge } from '@/types'

const CANVAS_ID_KEY = 'jewel_canvas_id'

interface TempMeta {
  explicitFromId?: string
  tempEdgeId?: string
}

function toNode(raw: Record<string, unknown>): Node {
  return {
    id: raw.id as string,
    canvasId: raw.canvasId as string,
    text: (raw.text as string | null) ?? null,
    url: (raw.url as string | null) ?? null,
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
    createdAt: raw.createdAt as string,
  }
}

export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const [loading, setLoading] = useState(true)
  const canvasIdRef = useRef<string | null>(null)
  const suppressNextCreateRef = useRef(false)
  const nodesRef = useRef<Node[]>([])
  nodesRef.current = nodes
  const tempMetaRef = useRef<Map<string, TempMeta>>(new Map())
  const discardedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    async function init() {
      const stored = localStorage.getItem(CANVAS_ID_KEY)
      if (stored) {
        const res = await fetch(`/api/canvases/${stored}`)
        if (res.ok) {
          const data = await res.json()
          canvasIdRef.current = stored
          setNodes(data.nodes.map(toNode))
          setEdges(data.edges.map(toEdge))
          setLoading(false)
          return
        }
        localStorage.removeItem(CANVAS_ID_KEY)
      }
      const res = await fetch('/api/canvases', { method: 'POST' })
      const data = await res.json()
      canvasIdRef.current = data.id
      localStorage.setItem(CANVAS_ID_KEY, data.id)
      setLoading(false)
    }
    init()
  }, [])

  const onNodeCreate = useCallback((x: number, y: number) => {
    if (suppressNextCreateRef.current) {
      suppressNextCreateRef.current = false
      return
    }
    const canvasId = canvasIdRef.current
    if (!canvasId) return

    const now = new Date().toISOString()
    const tempId = `temp_${Date.now()}`
    const tempNode: Node = { id: tempId, canvasId, text: null, url: null, x, y, createdAt: now, updatedAt: now }

    setNodes((prev) => {
      const nearest = findNearest(prev, x, y)
      if (nearest) {
        const tempEdgeId = `temp_edge_${Date.now()}`
        tempMetaRef.current.set(tempId, { tempEdgeId })
        const tempEdge: Edge = { id: tempEdgeId, canvasId, fromId: nearest.id, toId: tempId, createdAt: now }
        setEdges((e) => [...e, tempEdge])
      } else {
        tempMetaRef.current.set(tempId, {})
      }
      return [...prev, tempNode]
    })
    setSelectedNode(tempNode)
  }, [])

  const onNodeCreateFromEdge = useCallback((sourceId: string, x: number, y: number) => {
    const canvasId = canvasIdRef.current
    if (!canvasId) return

    const now = new Date().toISOString()
    const tempId = `temp_${Date.now()}`
    const tempEdgeId = `temp_edge_${Date.now()}`
    const tempNode: Node = { id: tempId, canvasId, text: null, url: null, x, y, createdAt: now, updatedAt: now }
    const tempEdge: Edge = { id: tempEdgeId, canvasId, fromId: sourceId, toId: tempId, createdAt: now }

    tempMetaRef.current.set(tempId, { explicitFromId: sourceId, tempEdgeId })
    setNodes((prev) => [...prev, tempNode])
    setEdges((prev) => [...prev, tempEdge])
    setSelectedNode(tempNode)
  }, [])

  const onNodeMove = useCallback(async (id: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, x, y, updatedAt: new Date().toISOString() } : n))
    )
    if (id.startsWith('temp_')) return
    await fetch(`/api/nodes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ x, y }),
    })
  }, [])

  const onNodeSelect = useCallback((node: Node) => {
    setSelectedNode(node)
  }, [])

  const onSave = useCallback(async (id: string, text: string): Promise<string> => {
    if (discardedRef.current.has(id)) { discardedRef.current.delete(id); return id }
    suppressNextCreateRef.current = true
    setTimeout(() => { suppressNextCreateRef.current = false }, 300)
    const canvasId = canvasIdRef.current
    if (!canvasId) return id

    if (id.startsWith('temp_')) {
      const node = nodesRef.current.find((n) => n.id === id)
      if (!node) return id
      const meta = tempMetaRef.current.get(id) ?? {}

      try {
        const res = await fetch('/api/nodes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            canvasId,
            x: node.x,
            y: node.y,
            text: text || null,
            ...(meta.explicitFromId ? { explicitFromId: meta.explicitFromId } : {}),
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const { node: realNode, edge: realEdge } = await res.json()
        const saved = toNode(realNode)
        const savedEdge = realEdge ? toEdge(realEdge) : null

        setNodes((prev) => prev.map((n) => (n.id === id ? saved : n)))
        setEdges((prev) => {
          const without = meta.tempEdgeId
            ? prev.filter((e) => e.id !== meta.tempEdgeId)
            : prev
          return savedEdge ? [...without, savedEdge] : without
        })

        tempMetaRef.current.delete(id)
        return saved.id
      } catch {
        return id
      }
    }

    setNodes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, text: text || null, updatedAt: new Date().toISOString() } : n
      )
    )
    await fetch(`/api/nodes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text || null }),
    })
    return id
  }, [])

  const onDelete = useCallback(async (id: string) => {
    const snapshot = { nodes: [] as Node[], edges: [] as Edge[] }
    setNodes((prev) => { snapshot.nodes = prev; return prev.filter((n) => n.id !== id) })
    setEdges((prev) => { snapshot.edges = prev; return prev.filter((e) => e.fromId !== id && e.toId !== id) })
    setSelectedNode(null)
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

  const selectedNodeCurrent =
    selectedNode ? nodes.find((n) => n.id === selectedNode.id) ?? null : null

  if (loading) {
    return (
      <div className="flex w-full h-screen items-center justify-center" style={{ background: '#0f172a' }}>
        <span className="text-slate-500 text-sm">Loading…</span>
      </div>
    )
  }

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: '#0f172a' }}>
      <Canvas
        nodes={nodes}
        edges={edges}
        onNodeCreate={onNodeCreate}
        onNodeCreateFromEdge={onNodeCreateFromEdge}
        onNodeMove={onNodeMove}
        onNodeSelect={onNodeSelect}
        onTransformChange={setTransform}
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
        />
      )}
    </div>
  )
}