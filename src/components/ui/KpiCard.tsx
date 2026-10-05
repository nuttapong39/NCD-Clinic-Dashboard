import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const METRIC_GRID: Record<number, string> = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' }

export interface KpiMetric {
  label: string
  value: string
  badge?: ReactNode
}

interface KpiCardProps {
  label: string
  description?: string
  icon: LucideIcon
  /** Icon tile classes from the category visuals */
  tileClassName: string
  /** Colour of the soft glow in the top-right corner */
  glowColor: string
  /** Up to three metrics */
  metrics: readonly KpiMetric[]
  footnote?: ReactNode
  featured?: boolean
  /** Toggle cards (filters) expose their state through aria-pressed */
  pressed?: boolean
  actionLabel: string
  onClick: () => void
}

/** Whole-card button: icon, label, up to two metrics and a footnote (UI-TEMPLATE §7.5). */
export function KpiCard({
  label,
  description,
  icon: Icon,
  tileClassName,
  glowColor,
  metrics,
  footnote,
  featured = false,
  pressed,
  actionLabel,
  onClick,
}: KpiCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label} — ${actionLabel}`}
      aria-pressed={pressed}
      className={cn(
        'surface surface-interactive group relative flex w-full flex-col overflow-hidden p-5 text-left',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        featured && 'bg-linear-to-br from-white via-white to-teal-50/70',
        pressed && 'border-primary/50 ring-2 ring-primary/25',
      )}
    >
      <span
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.08] blur-2xl"
        style={{ backgroundColor: glowColor }}
        aria-hidden="true"
      />
      <span className="flex items-start gap-3">
        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', tileClassName)} aria-hidden="true">
          <Icon className="h-5 w-5" />
        </span>
        <span className="block min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold tracking-tight">{label}</span>
          {description && <span className="block truncate text-xs text-muted-foreground">{description}</span>}
        </span>
        <ChevronRight
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
          aria-hidden="true"
        />
      </span>

      <span className={cn('mt-5 grid gap-3', METRIC_GRID[metrics.length] ?? 'grid-cols-2')}>
        {metrics.map((metric, index) => (
          <span key={metric.label} className="block min-w-0">
            <span className="block truncate text-xs text-muted-foreground">{metric.label}</span>
            <span
              className={cn(
                'block font-semibold tabular-nums tracking-tight',
                featured && index === 0 && metrics.length <= 2 ? 'text-3xl' : metrics.length >= 3 ? 'text-xl sm:text-2xl' : 'text-2xl',
              )}
            >
              {metric.value}
            </span>
            {metric.badge && <span className="mt-1 block">{metric.badge}</span>}
          </span>
        ))}
      </span>

      {footnote && (
        <span className="mt-4 block border-t border-border/70 pt-3 text-[11px] text-muted-foreground">{footnote}</span>
      )}
    </button>
  )
}
