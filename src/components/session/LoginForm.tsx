import { CircleHelp, KeyRound } from 'lucide-react'
import { AuthShell } from '@/components/session/AuthShell'
import { SessionIdForm } from '@/components/session/SessionIdForm'

interface LoginFormProps {
  onConnect: (sessionId: string) => Promise<boolean>
  error?: Error | null
  isConnecting: boolean
}

export function LoginForm({ onConnect, error, isConnecting }: LoginFormProps) {
  return (
    <AuthShell>
      <div className="mb-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-accent text-primary" aria-hidden="true">
          <KeyRound className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">เชื่อมต่อเซสชัน</h1>
        <p className="mt-1 text-sm text-muted-foreground">ป้อนรหัสเซสชัน BMS เพื่อเริ่มใช้งาน</p>
      </div>

      <SessionIdForm
        inputId="session-id"
        inputLabel="รหัสเซสชัน BMS"
        submitLabel="เชื่อมต่อ"
        onSubmit={onConnect}
        isConnecting={isConnecting}
        error={error}
        errorTitle="การเชื่อมต่อล้มเหลว"
        initialValue={import.meta.env.BMS_SESSION_ID || ''}
      />

      <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <CircleHelp className="h-4 w-4" aria-hidden="true" />
        <span>
          ต้องการความช่วยเหลือ?{' '}
          <a href="https://hosxp.net" target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
            ติดต่อฝ่ายสนับสนุน
          </a>
        </span>
      </p>
    </AuthShell>
  )
}
