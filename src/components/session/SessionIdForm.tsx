import { useState, type FormEvent, type ReactNode } from 'react'
import { ArrowRight, CircleAlert } from 'lucide-react'
import { LoadingSpinner } from '@/components/layout/LoadingSpinner'
import { toFriendlySessionError } from '@/utils/errorMessages'

interface SessionIdFormProps {
  inputId: string
  inputLabel: string
  submitLabel: string
  submitIcon?: ReactNode
  onSubmit: (sessionId: string) => Promise<boolean>
  isConnecting: boolean
  error?: Error | null
  errorTitle?: string
  initialValue?: string
}

/** Session-ID input with submit button and error callout, shared by login and expired screens. */
export function SessionIdForm({
  inputId,
  inputLabel,
  submitLabel,
  submitIcon,
  onSubmit,
  isConnecting,
  error,
  errorTitle,
  initialValue = '',
}: SessionIdFormProps) {
  const [sessionId, setSessionId] = useState(initialValue)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = sessionId.trim()
    if (!trimmed) return
    await onSubmit(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium">
          {inputLabel}
        </label>
        <input
          id={inputId}
          type="text"
          value={sessionId}
          onChange={(event) => setSessionId(event.target.value)}
          placeholder="02FA45D1-91EF-4D6E-B341-ED1436343807"
          disabled={isConnecting}
          autoComplete="off"
          spellCheck={false}
          className="w-full rounded-xl border bg-white px-4 py-3 font-mono text-sm transition-shadow placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">รหัสเซสชันอยู่ใน URL ของระบบ HOSxP หรือติดต่อผู้ดูแลระบบ</p>
      </div>

      {error && (
        <div role="alert" className="flex gap-3 rounded-xl border border-rose-100 bg-rose-50/80 p-3 text-sm text-rose-700">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            {errorTitle && <p className="font-medium">{errorTitle}</p>}
            <p className="break-words">{toFriendlySessionError(error)}</p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isConnecting || !sessionId.trim()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-teal-600 to-teal-500 px-4 py-3 text-sm font-medium text-white shadow-[0_10px_24px_-12px_rgb(13_148_136/0.8)] transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isConnecting ? (
          <>
            <LoadingSpinner size="sm" />
            <span>กำลังเชื่อมต่อ...</span>
          </>
        ) : (
          <>
            {submitIcon}
            <span>{submitLabel}</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  )
}
