import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function ToolbarButton({ className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center gap-2 rounded-xl border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors',
        'hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-border disabled:hover:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        className,
      )}
      {...props}
    />
  )
}
