import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  message?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
} as const

export function LoadingSpinner({ message, className, size = 'md' }: LoadingSpinnerProps) {
  return (
    <div role="status" className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <span className={cn('animate-spin rounded-full border-accent border-t-primary', SIZE_CLASSES[size])} aria-hidden="true" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  )
}
