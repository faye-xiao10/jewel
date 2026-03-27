import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { canvases } from '@/schema'

export async function GET() {
  try {
    const all = await db.select().from(canvases)
    return NextResponse.json(all)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch canvases', detail: String(error) },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const name = body?.name ?? 'Untitled Canvas'
    const [canvas] = await db.insert(canvases).values({ name }).returning()
    return NextResponse.json({ ...canvas, nodes: [], edges: [] }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create canvas', detail: String(error) },
      { status: 500 }
    )
  }
}
