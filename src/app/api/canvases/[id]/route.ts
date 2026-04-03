import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { canvases, nodes, edges } from '@/schema'
import { auth } from '@/lib/auth'
import { withRetry } from '@/lib/retry'

async function getOwnedCanvas(id: string, userId: string) {
  const [canvas] = await db.select().from(canvases).where(eq(canvases.id, id))
  if (!canvas) return { canvas: null, error: 'Canvas not found', status: 404 }
  if (canvas.userId && canvas.userId !== userId) return { canvas: null, error: 'Forbidden', status: 403 }
  return { canvas, error: null, status: 200 }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const { canvas, error, status } = await getOwnedCanvas(id, session.user.id)
    if (!canvas) return NextResponse.json({ error }, { status })

    const canvasNodes = await db.select().from(nodes).where(eq(nodes.canvasId, id))
    const canvasEdges = await db.select().from(edges).where(eq(edges.canvasId, id))
    return NextResponse.json({ canvas, nodes: canvasNodes, edges: canvasEdges })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch canvas', detail: String(error) }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const { canvas, error, status } = await getOwnedCanvas(id, session.user.id)
    if (!canvas) return NextResponse.json({ error }, { status })

    const body = await req.json()
    if (!body?.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    const [updated] = await withRetry(() =>
      db.update(canvases).set({ name: body.name, updatedAt: new Date() }).where(eq(canvases.id, id)).returning()
    )
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update canvas', detail: String(error) }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const { canvas, error, status } = await getOwnedCanvas(id, session.user.id)
    if (!canvas) return NextResponse.json({ error }, { status })

    await withRetry(() => db.delete(canvases).where(eq(canvases.id, id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete canvas', detail: String(error) }, { status: 500 })
  }
}
