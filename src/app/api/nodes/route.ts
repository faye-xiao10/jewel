import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { nodes, edges, canvases } from '@/schema'
import { findNearest } from '@/lib/nearest'
import { withRetry } from '@/lib/retry'
import { auth } from '@/lib/auth'
import type { Node } from '@/types'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { canvasId, x, y, explicitFromId, text, color, edgeColor } = body

    if (!canvasId || x == null || y == null) {
      return NextResponse.json({ error: 'canvasId, x, and y are required' }, { status: 400 })
    }

    const [canvas] = await db.select({ userId: canvases.userId }).from(canvases).where(eq(canvases.id, canvasId))
    if (!canvas) return NextResponse.json({ error: 'Canvas not found' }, { status: 404 })
    if (canvas.userId && canvas.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const result = await withRetry(async () => {
      const [node] = await db
        .insert(nodes)
        .values({ canvasId, x, y, text: text ?? null, color: color ?? null })
        .returning()

      let edge = null

      if (explicitFromId) {
        ;[edge] = await db
          .insert(edges)
          .values({ canvasId, fromId: explicitFromId, toId: node.id, color: edgeColor ?? null })
          .returning()
      } else {
        const existing = await db.select().from(nodes).where(eq(nodes.canvasId, canvasId))
        const others: Node[] = existing
          .filter((n) => n.id !== node.id)
          .map((n) => ({
            id: n.id,
            canvasId: n.canvasId,
            text: n.text,
            url: n.url,
            color: n.color ?? undefined,
            x: n.x,
            y: n.y,
            createdAt: n.createdAt.toISOString(),
            updatedAt: n.updatedAt.toISOString(),
          }))
        const nearest = findNearest(others, x, y)
        if (nearest) {
          ;[edge] = await db
            .insert(edges)
            .values({ canvasId, fromId: nearest.id, toId: node.id, color: edgeColor ?? null })
            .returning()
        }
      }

      return { node, edge }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('[POST /api/nodes]', error)
    return NextResponse.json({ error: 'Failed to create node', detail: String(error) }, { status: 500 })
  }
}
