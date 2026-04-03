import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { edges, canvases } from '@/schema'
import { withRetry } from '@/lib/retry'
import { auth } from '@/lib/auth'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { canvasId, fromId, toId, color } = body

    if (!canvasId || !fromId || !toId) {
      return NextResponse.json({ error: 'canvasId, fromId, and toId are required' }, { status: 400 })
    }
    if (fromId === toId) {
      return NextResponse.json({ error: 'Self-loops are not allowed' }, { status: 400 })
    }

    const [canvas] = await db.select({ userId: canvases.userId }).from(canvases).where(eq(canvases.id, canvasId))
    if (!canvas) return NextResponse.json({ error: 'Canvas not found' }, { status: 404 })
    if (canvas.userId && canvas.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const [edge] = await withRetry(() =>
      db.insert(edges).values({ canvasId, fromId, toId, color: color ?? null }).returning()
    )
    return NextResponse.json(edge, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create edge', detail: String(error) }, { status: 500 })
  }
}
