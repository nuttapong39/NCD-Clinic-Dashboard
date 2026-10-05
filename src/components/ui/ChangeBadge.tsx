import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatChange } from '@/utils/formatters'

/** Percent change pill; null means no comparable base (UI-TEMPLATE §7.6). */
export function ChangeBadge({ change }: { change: number | null }) {
  if (change === null) return <span className="text-xs text-muted-foreground">ไม่มีข้อมูลปีงบก่อน</span>
  const rounded = Math.round(change * 10) / 10
  const up = rounded > 0
  const flat = rounded === 0
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
        flat && 'bg-muted text-muted-foreground',
        !flat && up && 'bg-emerald-50 text-emerald-700',
        !flat && !up && 'bg-rose-50 text-rose-700',
      )}
    >
      {!flat && (up ? <ArrowUp className="h-3 w-3" aria-hidden="true" /> : <ArrowDown className="h-3 w-3" aria-hidden="true" />)}
      <span>{formatChange(rounded)}</span>
    </span>
  )
}
