import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { edges, canvases } from '@/schema'
import { withRetry } from '@/lib/retry'
import { auth } from '@/lib/auth'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const [edge] = await db.select().from(edges).where(eq(edges.id, id))
    if (!edge) return NextResponse.json({ error: 'Edge not found' }, { status: 404 })

    const [canvas] = await db.select({ userId: canvases.userId }).from(canvases).where(eq(canvases.id, edge.canvasId))
    if (canvas?.userId && canvas.userId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await withRetry(() => db.delete(edges).where(eq(edges.id, id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete edge', detail: String(error) }, { status: 500 })
  }
}
