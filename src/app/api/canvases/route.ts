import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { canvases } from '@/schema'
import { auth } from '@/lib/auth'
import { withRetry } from '@/lib/retry'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const all = await db
      .select()
      .from(canvases)
      .where(eq(canvases.userId, session.user.id))
    return NextResponse.json(all)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch canvases', detail: String(error) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const name = body?.name ?? 'Untitled Canvas'
    const [canvas] = await withRetry(() =>
      db.insert(canvases).values({ name, userId: session.user.id }).returning()
    )
    return NextResponse.json({ ...canvas, nodes: [], edges: [] }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create canvas', detail: String(error) }, { status: 500 })
  }
}
