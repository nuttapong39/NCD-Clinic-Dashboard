// Loading / Error / Empty states — UI-TEMPLATE §7.11
import { Inbox, RefreshCw, TriangleAlert } from 'lucide-react'
import { ToolbarButton } from '@/components/ui/ToolbarButton'

export function LoadingState({ message = 'กำลังโหลดข้อมูล…' }: { message?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-accent border-t-primary" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-50 text-rose-600" aria-hidden="true">
        <TriangleAlert className="h-6 w-6" />
      </span>
      <p className="max-w-md text-sm text-foreground">{message}</p>
      <ToolbarButton onClick={onRetry}>
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        ลองใหม่
      </ToolbarButton>
    </div>
  )
}

interface EmptyStateProps {
  title: string
  description: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent text-primary" aria-hidden="true">
        <Inbox className="h-6 w-6" />
      </span>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
