// =============================================================================
// Shared chart pieces — custom tooltip card and legend (UI-TEMPLATE §8)
// =============================================================================

import type { ReactNode } from 'react'
import { formatNumber } from '@/utils/formatters'

export interface TooltipRow {
  label: string
  value: number | null
  color?: string
  dashed?: boolean
  emphasis?: boolean
}

export function ChartTooltipCard({ title, rows, footer }: { title: ReactNode; rows: readonly TooltipRow[]; footer?: ReactNode }) {
  return (
    <div className="min-w-44 rounded-xl border bg-white/95 p-3 text-xs shadow-[0_12px_32px_-12px_rgb(15_23_42/0.25)] backdrop-blur">
      <p className="mb-2 font-medium text-foreground">{title}</p>
      <ul className="space-y-1">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-muted-foreground">
              {row.color && (
                <span
                  aria-hidden="true"
                  className={row.dashed ? 'h-0 w-3 border-t-2 border-dashed' : 'h-2.5 w-2.5 rounded-sm'}
                  style={row.dashed ? { borderColor: row.color } : { backgroundColor: row.color }}
                />
              )}
              {row.label}
            </span>
            <span className={row.emphasis ? 'font-semibold tabular-nums text-foreground' : 'tabular-nums text-foreground'}>
              {formatNumber(row.value)}
            </span>
          </li>
        ))}
      </ul>
      {footer && <p className="mt-2 border-t pt-2 text-[11px] text-muted-foreground">{footer}</p>}
    </div>
  )
}

export interface LegendItem {
  key: string
  label: string
  color: string
  kind?: 'swatch' | 'dashed' | 'area'
}

export function ChartLegend({ items }: { items: readonly LegendItem[] }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {items.map((item) => (
        <li key={item.key} className="flex items-center gap-1.5">
          {item.kind === 'dashed' ? (
            <span aria-hidden="true" className="h-0 w-4 border-t-2 border-dashed" style={{ borderColor: item.color }} />
          ) : (
            <span
              aria-hidden="true"
              className={item.kind === 'area' ? 'h-3 w-4 rounded-sm' : 'h-2.5 w-2.5 rounded-sm'}
              style={{ backgroundColor: item.color }}
            />
          )}
          {item.label}
        </li>
      ))}
    </ul>
  )
}
