import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { canvases, nodes, edges } from '@/schema'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [canvas] = await db.select().from(canvases).where(eq(canvases.id, id))
    if (!canvas) {
      return NextResponse.json({ error: 'Canvas not found' }, { status: 404 })
    }
    const canvasNodes = await db.select().from(nodes).where(eq(nodes.canvasId, id))
    const canvasEdges = await db.select().from(edges).where(eq(edges.canvasId, id))
    return NextResponse.json({ canvas, nodes: canvasNodes, edges: canvasEdges })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch canvas', detail: String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    if (!body?.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    const [updated] = await db
      .update(canvases)
      .set({ name: body.name, updatedAt: new Date() })
      .where(eq(canvases.id, id))
      .returning()
    if (!updated) {
      return NextResponse.json({ error: 'Canvas not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update canvas', detail: String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [deleted] = await db
      .delete(canvases)
      .where(eq(canvases.id, id))
      .returning()
    if (!deleted) {
      return NextResponse.json({ error: 'Canvas not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete canvas', detail: String(error) },
      { status: 500 }
    )
  }
}
