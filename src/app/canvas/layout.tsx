import { SidebarProvider } from '@/context/SidebarContext'

export default function CanvasLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      {children}
    </SidebarProvider>
  )
}
