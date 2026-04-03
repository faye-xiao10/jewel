import { NextResponse } from 'next/server'
import { and, eq, gte, inArray, lt, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { nodes, edges, canvases } from '@/schema'
import { withRetry } from '@/lib/retry'
import { auth } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

async function getOwnedCanvas(canvasId: string, userId: string) {
  const [canvas] = await db.select({ userId: canvases.userId }).from(canvases).where(eq(canvases.id, canvasId))
  if (!canvas) return { ok: false, status: 404, error: 'Canvas not found' }
  if (canvas.userId && canvas.userId !== userId) return { ok: false, status: 403, error: 'Forbidden' }
  return { ok: true, status: 200, error: null }
}

export async function GET(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const check = await getOwnedCanvas(id, session.user.id)
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

    const url = new URL(req.url)
    const offsetMinutes = parseInt(url.searchParams.get('offset') ?? '0')
    const rows = await withRetry(() =>
      db.execute(sql`
        SELECT DISTINCT ON (local_date) local_date::text AS date, color
        FROM (
          SELECT
            (created_at + (${offsetMinutes} * interval '1 minute'))::date AS local_date,
            color,
            created_at
          FROM nodes
          WHERE canvas_id = ${id} AND color IS NOT NULL
        ) sub
        ORDER BY local_date DESC, created_at DESC
      `)
    )
    const sessions = (rows.rows as { date: string; color: string }[]).map(r => ({
      date: r.date,
      color: r.color,
    }))
    return NextResponse.json({ sessions })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch session colors', detail: String(error) }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const check = await getOwnedCanvas(id, session.user.id)
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: check.status })

    const body = await req.json()
    const { date, color } = body as { date?: unknown; color?: unknown }

    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 })
    }
    if (typeof color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(color)) {
      return NextResponse.json({ error: 'color must be a hex color' }, { status: 400 })
    }

    const offsetMinutes = typeof body.offset === 'number' ? body.offset : 0
    const dayStart = new Date(`${date}T00:00:00Z`)
    dayStart.setUTCMinutes(dayStart.getUTCMinutes() - offsetMinutes)
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
    return NextResponse.json({ error: 'Failed to update session colors', detail: String(error) }, { status: 500 })
  }
}
