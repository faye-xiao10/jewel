import type { Node } from '@/types'

export function findNearest(
  nodes: Node[],
  x: number,
  y: number,
  excludeId?: string
): Node | null {
  const candidates = nodes.filter((n) => n.id !== excludeId)
  if (candidates.length === 0) return null
  return candidates.reduce((closest, node) => {
    const d = Math.hypot(node.x - x, node.y - y)
    const dClosest = Math.hypot(closest.x - x, closest.y - y)
    return d < dClosest ? node : closest
  })
}
