'use client'

import { useEffect, useRef, useCallback } from 'react'
import * as d3 from 'd3'
import type { Node, Edge } from '@/types'

interface CanvasProps {
  nodes: Node[]
  edges: Edge[]
  onNodeCreate: (x: number, y: number) => void
  onNodeCreateFromEdge: (sourceId: string, x: number, y: number) => void
  onNodeMove: (id: string, x: number, y: number) => void
  onNodeSelect: (node: Node) => void
  onTransformChange: (t: { x: number; y: number; k: number }) => void
}

const INDIGO = '#6366f1'
const BG = '#0f172a'
const TEXT_COLOR = '#e2e8f0'
const NODE_R = 6
const LONG_PRESS_MS = 300
const CANCEL_RADIUS = 10
const QUESTION_COLOR = '#f59e0b' 

export default function Canvas({
  nodes,
  edges,
  onNodeCreate,
  onNodeCreateFromEdge,
  onNodeMove,
  onNodeSelect,
  onTransformChange,
}: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const transformRef = useRef({ x: 0, y: 0, k: 1 })
  const nodesRef = useRef(nodes)
  nodesRef.current = nodes

  // Edge-draw state
  const edgeDrawRef = useRef<{
    active: boolean
    sourceId: string
    sourceX: number
    sourceY: number
    startX: number
    startY: number
    timer: ReturnType<typeof setTimeout> | null
  }>({ active: false, sourceId: '', sourceX: 0, sourceY: 0, startX: 0, startY: 0, timer: null })

  const cancelEdgeDraw = useCallback(() => {
    const svg = d3.select(svgRef.current)
    svg.select('.rubber-band').remove()
    svg.select('.glow-ring').remove()
    edgeDrawRef.current.active = false
    edgeDrawRef.current.sourceId = ''
  }, [])
  
  function wrapText(text: string, maxChars: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let current = ''
    for (const word of words) {
      if ((current + ' ' + word).trim().length > maxChars) {
        if (current) lines.push(current)
        current = word
      } else {
        current = current ? current + ' ' + word : word
      }
    }
    if (current) lines.push(current)
    return lines
  }

  // Setup SVG, zoom, defs once
  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return
    const svg = d3.select(svgEl)
    svg.selectAll('*').remove()

    // Defs: arrowhead
    const defs = svg.append('defs')
    defs
      .append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -4 8 8')
      .attr('refX', 14)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L8,0L0,4')
      .attr('fill', INDIGO)

    const zoomLayer = svg.append('g').attr('class', 'zoom-layer')
    zoomLayer.append('g').attr('class', 'edges')
    zoomLayer.append('g').attr('class', 'nodes')

    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        const { x, y, k } = event.transform
        zoomLayer.attr('transform', event.transform.toString())
        transformRef.current = { x, y, k }
        onTransformChange({ x, y, k })
      })

    svg.call(zoom)

    // Click empty space → create node
    svg.on('click', (event: MouseEvent) => {
      if ((event.target as Element).closest('.nodes')) return
      if (edgeDrawRef.current.active) return
      const t = transformRef.current
      const [mx, my] = d3.pointer(event, svgEl)
      const x = (mx - t.x) / t.k
      const y = (my - t.y) / t.k
      onNodeCreate(x, y)
    })
  }, [onNodeCreate, onTransformChange])

  // Data joins: edges + nodes
  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return
    const svg = d3.select(svgEl)

    // --- Edges ---
    const edgeGroup = svg.select<SVGGElement>('g.edges')
    const edgeSel = edgeGroup
      .selectAll<SVGLineElement, Edge>('line.edge')
      .data(edges, (d) => d.id)

    edgeSel.join(
      (enter) =>
        enter
          .append('line')
          .attr('class', 'edge')
          .attr('stroke', INDIGO)
          .attr('stroke-width', 1.5)
          .attr('stroke-opacity', 0.6)
          .attr('marker-end', 'url(#arrow)'),
      (update) => update,
      (exit) => exit.remove()
    )

    // Position all edges
    const nodeMap = new Map(nodesRef.current.map((n) => [n.id, n]))
    edgeGroup.selectAll<SVGLineElement, Edge>('line.edge').each(function (d) {
      const from = nodeMap.get(d.fromId)
      const to = nodeMap.get(d.toId)
      if (!from || !to) return
      d3.select(this)
        .attr('x1', from.x)
        .attr('y1', from.y)
        .attr('x2', to.x)
        .attr('y2', to.y)
    })

    // --- Nodes ---
    const nodeGroup = svg.select<SVGGElement>('g.nodes')

    const nodeSel = nodeGroup
      .selectAll<SVGGElement, Node>('g.node')
      .data(nodes, (d) => d.id)

    const enterSel = nodeSel
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer')

    enterSel.append('circle').attr('r', NODE_R)
    enterSel.append('text')

    const allNodes = nodeSel.merge(enterSel)

    allNodes.attr('transform', (d) => `translate(${d.x},${d.y})`)

    allNodes
      .select('circle')
      .attr('fill', 'white')
      .attr('stroke', (d) => (d.text?.endsWith('?') ? QUESTION_COLOR : INDIGO))
      .attr('stroke-width', 2)

      allNodes.each(function(d) {
        const t = d.text ?? ''
        const stripped = t.replace(/^#{1,3} /, '')
        const isH1 = t.startsWith('# ')
        const isH2 = t.startsWith('## ')
        const isH3 = t.startsWith('### ')
        const isQuestion = t.endsWith('?')
      
        const fontSize = isH1 ? 60 : isH2 ? 45 : isH3 ? 30 : 13
        const fontWeight = isH1 ? '800' : isH2 ? '700' : isH3 ? '600' : '400'
        const fill = isQuestion ? QUESTION_COLOR : TEXT_COLOR
        const maxChars = isH1 ? 15 : isH2 ? 20 : isH3 ? 25 : 40
        const lineHeight = fontSize * 1.2
      
        const lines = wrapText(stripped, maxChars)
        const textEl = d3.select(this).select<SVGTextElement>('text')
        textEl.selectAll('tspan').remove()
        textEl
          .attr('x', 12)
          .attr('y', 4)
          .attr('font-size', `${fontSize}px`)
          .attr('font-weight', fontWeight)
          .attr('fill', fill)
      
        lines.forEach((line, i) => {
          textEl.append('tspan')
            .attr('x', 12)
            .attr('dy', i === 0 ? 0 : lineHeight)
            .text(line)
        })
      })

    // Drag behavior
    const drag = d3
      .drag<SVGGElement, Node>()
      .on('start', function (event, d) {
        const ed = edgeDrawRef.current
        if (ed.timer) clearTimeout(ed.timer)

        ed.startX = event.x
        ed.startY = event.y

        ed.timer = setTimeout(() => {
          ed.active = true
          ed.sourceId = d.id
          ed.sourceX = d.x
          ed.sourceY = d.y

          // Glow ring
          d3.select(svgEl)
            .select('g.zoom-layer')
            .select('g.nodes')
            .selectAll<SVGGElement, Node>('g.node')
            .filter((n) => n.id === d.id)
            .append('circle')
            .attr('class', 'glow-ring')
            .attr('r', NODE_R + 6)
            .attr('fill', 'none')
            .attr('stroke', INDIGO)
            .attr('stroke-width', 2)
            .attr('stroke-opacity', 0.5)
            .attr('filter', 'blur(2px)')
        }, LONG_PRESS_MS)
      })
      .on('drag', function (event, d) {
        const ed = edgeDrawRef.current
        if (ed.timer) {
          const dx = event.x - ed.startX
          const dy = event.y - ed.startY
          if (Math.hypot(dx, dy) > 4) {
            clearTimeout(ed.timer)
            ed.timer = null
          }
        }

        if (ed.active) {
          // Rubber band in screen space — convert source to screen
          const t = transformRef.current
          const sx = ed.sourceX * t.k + t.x
          const sy = ed.sourceY * t.k + t.y
          const svg2 = d3.select(svgEl)
          svg2.select('.rubber-band').remove()
          svg2
            .append('line')
            .attr('class', 'rubber-band')
            .attr('x1', sx)
            .attr('y1', sy)
            .attr('x2', event.sourceEvent.offsetX)
            .attr('y2', event.sourceEvent.offsetY)
            .attr('stroke', INDIGO)
            .attr('stroke-width', 1.5)
            .attr('stroke-dasharray', '5,4')
            .attr('pointer-events', 'none')
          return
        }

        // Normal drag
        const t = transformRef.current
        d.x = event.x
        d.y = event.y
        d3.select(this).attr('transform', `translate(${d.x},${d.y})`)

        // Update connected edges live
        const edgeGroupEl = d3.select(svgEl).select('g.edges')
        edgeGroupEl.selectAll<SVGLineElement, Edge>('line.edge').each(function (ed2) {
          if (ed2.fromId === d.id) {
            d3.select(this).attr('x1', d.x).attr('y1', d.y)
          }
          if (ed2.toId === d.id) {
            d3.select(this).attr('x2', d.x).attr('y2', d.y)
          }
        })
        // silence unused var warning
        void t
      })
      .on('end', function (event, d) {
        const ed = edgeDrawRef.current
        if (ed.timer) {
          clearTimeout(ed.timer)
          ed.timer = null
        }

        if (ed.active) {
          d3.select(svgEl).select('.rubber-band').remove()
          d3.select(svgEl).select('.glow-ring').remove()
          ed.active = false

          const dx = event.sourceEvent.offsetX - (ed.sourceX * transformRef.current.k + transformRef.current.x)
          const dy = event.sourceEvent.offsetY - (ed.sourceY * transformRef.current.k + transformRef.current.y)
          if (Math.hypot(dx, dy) < CANCEL_RADIUS) {
            // too close — cancel, treat as click
            onNodeSelect(d)
            return
          }

          const t = transformRef.current
          const x = (event.sourceEvent.offsetX - t.x) / t.k
          const y = (event.sourceEvent.offsetY - t.y) / t.k
          onNodeCreateFromEdge(ed.sourceId, x, y)
          ed.sourceId = ''
          return
        }

        // Check if it was a click (no movement)
        const dx2 = event.x - ed.startX
        const dy2 = event.y - ed.startY
        if (Math.hypot(dx2, dy2) < 4) {
          onNodeSelect(d)
          return
        }

        onNodeMove(d.id, d.x, d.y)
      })

    nodeGroup.selectAll<SVGGElement, Node>('g.node').call(drag)
  }, [nodes, edges, onNodeMove, onNodeSelect, onNodeCreateFromEdge, cancelEdgeDraw])

  return (
    <svg
      ref={svgRef}
      className="w-full h-screen block"
      style={{ background: BG }}
      onMouseDown={(e) => e.preventDefault()}  // ← add this
    />
  )
}
