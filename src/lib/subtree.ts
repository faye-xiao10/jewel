import type { Node, Edge } from '@/types'

export function getSubtreeIds(rootId: string, edges: Edge[]): Set<string> {
  const children = new Map<string, string[]>()
  for (const e of edges) {
    if (!children.has(e.fromId)) children.set(e.fromId, [])
    children.get(e.fromId)!.push(e.toId)
  }
  const visited = new Set<string>()
  const queue = [rootId]
  while (queue.length) {
    const id = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    for (const child of children.get(id) ?? []) queue.push(child)
  }
  return visited
}

export function subtreeToMarkdown(
  nodes: Node[],
  edges: Edge[],
  selectedIds: Set<string>,
  rootId: string
): string {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]))
  const children = new Map<string, string[]>()
  for (const e of edges) {
    if (!selectedIds.has(e.fromId) || !selectedIds.has(e.toId)) continue
    if (!children.has(e.fromId)) children.set(e.fromId, [])
    children.get(e.fromId)!.push(e.toId)
  }
  const lines: string[] = []
  const queue: { id: string; depth: number }[] = [{ id: rootId, depth: 0 }]
  const visited = new Set<string>()
  while (queue.length) {
    const { id, depth } = queue.shift()!
    if (visited.has(id)) continue
    visited.add(id)
    const node = nodeMap.get(id)
    const text = (node?.text ?? '').trim()
    if (text) lines.push('  '.repeat(depth) + '- ' + text)
    for (const childId of children.get(id) ?? []) {
      queue.push({ id: childId, depth: depth + 1 })
    }
  }
  return lines.join('\n')
}