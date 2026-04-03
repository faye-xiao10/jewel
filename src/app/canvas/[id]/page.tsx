import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import CanvasPage from '@/components/CanvasPage'

export default async function CanvasRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const { id } = await params
  return <CanvasPage canvasId={id} />
}
