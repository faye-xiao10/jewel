import type { Edge } from '@/types'

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