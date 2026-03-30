import { NextResponse } from 'next/server'
import { and, eq, gte, inArray, lt, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { nodes, edges } from '@/schema'
import { withRetry } from '@/lib/retry'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  try {
    const { id } = await params
    const rows = await withRetry(() =>
      db.execute(sql`
        SELECT DISTINCT ON (created_at::date)
          created_at::date::text AS date,
          color
        FROM nodes
        WHERE canvas_id = ${id} AND color IS NOT NULL
        ORDER BY created_at::date DESC, created_at DESC
      `)
    )
    const sessions = (rows.rows as { date: string; color: string }[]).map(r => ({
      date: r.date,
      color: r.color,
    }))
    return NextResponse.json({ sessions })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch session colors', detail: String(error) },
      { status: 500 }
    )
  }
}

export async function PATCH(req: Request, { params }: Params) {
  try {
    const { id } = await params
    const body = await req.json()
    const { date, color } = body as { date?: unknown; color?: unknown }

    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 })
    }
    if (typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return NextResponse.json({ error: 'color must be a hex color' }, { status: 400 })
    }

    const dayStart = new Date(`${date}T00:00:00Z`)
    const dayEnd = new Date(dayStart)
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1)

    const result = await withRetry(async () => {
      const updatedNodes = await db
        .update(nodes)
        .set({ color })
        .where(and(eq(nodes.canvasId, id), gte(nodes.createdAt, dayStart), lt(nodes.createdAt, dayEnd)))
        .returning({ id: nodes.id })

      if (updatedNodes.length > 0) {
        const nodeIds = updatedNodes.map(n => n.id)
        await db
          .update(edges)
          .set({ color })
          .where(and(eq(edges.canvasId, id), inArray(edges.toId, nodeIds)))
      }

      return updatedNodes.length
    })

    return NextResponse.json({ updated: result })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update session colors', detail: String(error) },
      { status: 500 }
    )
  }
}
