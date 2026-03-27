'use client'

import { useState, useCallback, useRef } from 'react'
import Canvas from '@/components/Canvas'
import NodePopover from '@/components/NodePopover'
import { findNearest } from '@/lib/nearest'
import type { Node, Edge } from '@/types'

export default function Home() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 })
  const suppressNextCreateRef = useRef(false)

  const onNodeCreate = useCallback((x: number, y: number) => {
    if (suppressNextCreateRef.current) {
      suppressNextCreateRef.current = false
      return
    }
    const now = new Date().toISOString()
    const newNode: Node = {
      id: crypto.randomUUID(),
      canvasId: 'local',
      text: null,
      url: null,
      x,
      y,
      createdAt: now,
      updatedAt: now,
    }
    setNodes((prev) => {
      const nearest = findNearest(prev, x, y)
      if (nearest) {
        const edge: Edge = {
          id: crypto.randomUUID(),
          canvasId: 'local',
          fromId: nearest.id,
          toId: newNode.id,
          createdAt: now,
        }
        setEdges((e) => [...e, edge])
      }
      return [...prev, newNode]
    })
    setSelectedNode(newNode)
  }, [])

  const onNodeCreateFromEdge = useCallback((sourceId: string, x: number, y: number) => {
    const now = new Date().toISOString()
    const newNode: Node = {
      id: crypto.randomUUID(),
      canvasId: 'local',
      text: null,
      url: null,
      x,
      y,
      createdAt: now,
      updatedAt: now,
    }
    const edge: Edge = {
      id: crypto.randomUUID(),
      canvasId: 'local',
      fromId: sourceId,
      toId: newNode.id,
      createdAt: now,
    }
    setNodes((prev) => [...prev, newNode])
    setEdges((prev) => [...prev, edge])
    setSelectedNode(newNode)
  }, [])

  const onNodeMove = useCallback((id: string, x: number, y: number) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, x, y, updatedAt: new Date().toISOString() } : n))
    )
  }, [])

  const onNodeSelect = useCallback((node: Node) => {
    setSelectedNode(node)
  }, [])

  const onSave = useCallback((id: string, text: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, text: text || null, updatedAt: new Date().toISOString() } : n
      )
    )
  }, [])

  const onDelete = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id))
    setEdges((prev) => prev.filter((e) => e.fromId !== id && e.toId !== id))
    setSelectedNode(null)
  }, [])

  // Called when an empty new node is dismissed — suppress the canvas click that follows
  const onDiscard = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id))
    setEdges((prev) => prev.filter((e) => e.fromId !== id && e.toId !== id))
    setSelectedNode(null)
    suppressNextCreateRef.current = true
    // Auto-reset in case no canvas click follows (e.g. Escape key, clicking a node)
    setTimeout(() => { suppressNextCreateRef.current = false }, 300)
  }, [])

  const selectedNodeCurrent =
    selectedNode ? nodes.find((n) => n.id === selectedNode.id) ?? null : null

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
        />
      )}
    </div>
  )
}
