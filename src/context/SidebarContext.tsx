'use client'
import { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextValue {
  isOpen: boolean
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    Promise.resolve(localStorage.getItem('jewel-sidebar-open') === 'true').then(setIsOpen)
  }, [])

  function toggle() {
    setIsOpen((prev) => {
      localStorage.setItem('jewel-sidebar-open', String(!prev))
      return !prev
    })
  }

  return (
    <SidebarContext.Provider value={{ isOpen, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider')
  return ctx
}
