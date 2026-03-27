import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { edges } from '@/schema'
import { withRetry } from '@/lib/retry'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { canvasId, fromId, toId } = body

    if (!canvasId || !fromId || !toId) {
      return NextResponse.json(
        { error: 'canvasId, fromId, and toId are required' },
        { status: 400 }
      )
    }
    if (fromId === toId) {
      return NextResponse.json({ error: 'Self-loops are not allowed' }, { status: 400 })
    }

    const [edge] = await withRetry(() =>
      db.insert(edges).values({ canvasId, fromId, toId }).returning()
    )
    return NextResponse.json(edge, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create edge', detail: String(error) },
      { status: 500 }
    )
  }
}
