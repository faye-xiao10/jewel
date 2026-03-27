import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { edges } from '@/schema'
import { withRetry } from '@/lib/retry'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [deleted] = await withRetry(() =>
      db.delete(edges).where(eq(edges.id, id)).returning()
    )
    if (!deleted) {
      return NextResponse.json({ error: 'Edge not found' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete edge', detail: String(error) },
      { status: 500 }
    )
  }
}
