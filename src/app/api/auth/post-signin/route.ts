import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { canvases } from '@/schema'
import { eq, desc } from 'drizzle-orm'
import { withRetry } from '@/lib/retry'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const userId = session.user.id

  try {
    const [existing] = await db
      .select({ id: canvases.id })
      .from(canvases)
      .where(eq(canvases.userId, userId))
      .orderBy(desc(canvases.updatedAt))
      .limit(1)

    if (existing) {
      redirect(`/canvas/${existing.id}`)
    }

    const [created] = await withRetry(() =>
      db
        .insert(canvases)
        .values({ userId, name: 'Untitled Canvas' })
        .returning({ id: canvases.id })
    )
    redirect(`/canvas/${created.id}`)
  } catch (error) {
    // redirect throws internally — rethrow non-redirect errors
    throw error
  }
}
