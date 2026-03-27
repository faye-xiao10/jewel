import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { nodes } from '@/schema'
import { withRetry } from '@/lib/retry'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const updates: Partial<{
      text: string | null
      url: string | null
      x: number
      y: number
      updatedAt: Date
    }> = { updatedAt: new Date() }

    if ('text' in body) updates.text = body.text ?? null
    if ('url' in body) updates.url = body.url ?? null
    if ('x' in body) updates.x = body.x
    if ('y' in body) updates.y = body.y

    const [updated] = await withRetry(() =>
      db.update(nodes).set(updates).where(eq(nodes.id, id)).returning()
    )

    if (!updated) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }
    return NextResponse.json(updated)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update node', detail: String(error) },
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
    const [deleted] = await withRetry(() =>
      db.delete(nodes).where(eq(nodes.id, id)).returning()
    )
    if (!deleted) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete node', detail: String(error) },
      { status: 500 }
    )
  }
}
