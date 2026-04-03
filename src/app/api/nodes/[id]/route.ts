import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { nodes, canvases } from '@/schema'
import { withRetry } from '@/lib/retry'
import { auth } from '@/lib/auth'

async function getNodeWithOwnership(nodeId: string, userId: string) {
  const [node] = await db.select().from(nodes).where(eq(nodes.id, nodeId))
  if (!node) return { node: null, error: 'Node not found', status: 404 }
  const [canvas] = await db.select({ userId: canvases.userId }).from(canvases).where(eq(canvases.id, node.canvasId))
  if (canvas?.userId && canvas.userId !== userId) return { node: null, error: 'Forbidden', status: 403 }
  return { node, error: null, status: 200 }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const { node, error, status } = await getNodeWithOwnership(id, session.user.id)
    if (!node) return NextResponse.json({ error }, { status })

    const body = await req.json()
    const updates: Partial<{ text: string | null; url: string | null; x: number; y: number; updatedAt: Date }> = {
      updatedAt: new Date(),
    }
    if ('text' in body) updates.text = body.text ?? null
    if ('url' in body) updates.url = body.url ?? null
    if ('x' in body) updates.x = body.x
    if ('y' in body) updates.y = body.y

    const [updated] = await withRetry(() =>
      db.update(nodes).set(updates).where(eq(nodes.id, id)).returning()
    )
    if (!updated) return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update node', detail: String(error) }, { status: 500 })
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
    const { node, error, status } = await getNodeWithOwnership(id, session.user.id)
    if (!node) return NextResponse.json({ error }, { status })

    await withRetry(() => db.delete(nodes).where(eq(nodes.id, id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete node', detail: String(error) }, { status: 500 })
  }
}
