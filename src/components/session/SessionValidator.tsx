// =============================================================================
// Session Validator — shows the screen that matches the session state
// =============================================================================

import type { ReactNode } from 'react'
import { useBmsSessionContext } from '@/contexts/BmsSessionContext'
import { BrandMark } from '@/components/layout/BrandMark'
import { LoginForm } from './LoginForm'
import { SessionExpired } from './SessionExpired'

function ConnectingScreen() {
  return (
    <div role="status" className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="relative grid h-24 w-24 place-items-center" aria-hidden="true">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-accent border-t-primary" />
        <span className="absolute inset-3 animate-ping rounded-2xl bg-teal-200/40" />
        <BrandMark size="lg" className="relative" />
      </span>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">กำลังเชื่อมต่อ</h1>
        <p className="mt-1 text-sm text-muted-foreground">ยืนยันตัวตนกับ BMS Session API...</p>
      </div>
    </div>
  )
}

export function SessionValidator({ children }: { children: ReactNode }) {
  const { sessionState, error, connectSession } = useBmsSessionContext()

  // Wait for the initial session check to complete (prevents flicker)
  if (sessionState === 'idle') return null

  if (sessionState === 'connecting') return <ConnectingScreen />

  if (sessionState === 'expired') {
    return <SessionExpired onReconnect={connectSession} error={error} isConnecting={false} />
  }

  if (sessionState === 'disconnected') {
    return <LoginForm onConnect={connectSession} error={error} isConnecting={false} />
  }

  return <>{children}</>
}
