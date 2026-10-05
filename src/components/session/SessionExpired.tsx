import { RefreshCw, TriangleAlert } from 'lucide-react'
import { AuthShell } from '@/components/session/AuthShell'
import { SessionIdForm } from '@/components/session/SessionIdForm'

interface SessionExpiredProps {
  onReconnect: (sessionId: string) => Promise<boolean>
  error?: Error | null
  isConnecting: boolean
}

export function SessionExpired({ onReconnect, error, isConnecting }: SessionExpiredProps) {
  return (
    <AuthShell>
      <div className="mb-6 text-center">
        <span
          className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-100"
          aria-hidden="true"
        >
          <TriangleAlert className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">เซสชันหมดอายุ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          เซสชัน BMS ของคุณหมดอายุแล้ว กรุณาป้อนรหัสเซสชันใหม่เพื่อเชื่อมต่อต่อ
        </p>
      </div>

      <SessionIdForm
        inputId="session-id"
        inputLabel="รหัสเซสชันใหม่"
        submitLabel="เชื่อมต่อใหม่"
        submitIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
        onSubmit={onReconnect}
        isConnecting={isConnecting}
        error={error}
      />
    </AuthShell>
  )
}
