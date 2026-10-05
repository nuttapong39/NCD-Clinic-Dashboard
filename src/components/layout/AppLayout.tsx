import type { ReactNode } from 'react'
import { AppHeader } from '@/components/layout/AppHeader'

/** Transparent layout; the page gradient lives on <body> (UI-TEMPLATE §6). */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
    </div>
  )
}
