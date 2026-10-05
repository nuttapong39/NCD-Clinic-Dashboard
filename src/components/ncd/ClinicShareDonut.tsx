import { memo } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { OTHER_CLINICS_KEY } from '@/services/ncdMonthlyProcessing'
import type { ClinicSeriesGroup, ClinicShare } from '@/types/ncd'
import { ChartTooltipCard } from '@/components/ncd/chartParts'
import { clinicSeriesColor } from '@/components/ncd/visuals'
import { formatNumber, formatPercent } from '@/utils/formatters'
import { cn } from '@/lib/utils'

interface ClinicShareDonutProps {
  shares: readonly ClinicShare[]
  /** All series in display order, so each clinic keeps the colour it has in the trend chart */
  groups: readonly ClinicSeriesGroup[]
  onSelectGroup: (group: ClinicSeriesGroup) => void
}

export const ClinicShareDonut = memo(function ClinicShareDonut({ shares, groups, onSelectGroup }: ClinicShareDonutProps) {
  const total = shares.reduce((sum, share) => sum + share.appointments, 0)
  const colorOf = (share: ClinicShare) =>
    clinicSeriesColor(groups.findIndex((group) => group.key === share.key), share.key)
  const isClickable = (share: ClinicShare) => share.key !== OTHER_CLINICS_KEY

  const renderTooltip = ({ active, payload }: TooltipContentProps) => {
    const share = payload?.[0]?.payload as ClinicShare | undefined
    if (!active || !share) return null
    return (
      <ChartTooltipCard
        title={share.label}
        rows={[{ label: 'นัด', value: share.appointments, color: colorOf(share) }]}
        footer={`${formatPercent(share.percentage)} ของนัดทั้งหมด`}
      />
    )
  }

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,220px)_1fr]">
      <div className="relative mx-auto h-56 w-56" role="img" aria-label="แผนภูมิโดนัทสัดส่วนนัดแยกตามคลินิก">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={renderTooltip} />
            <Pie
              data={shares as ClinicShare[]}
              dataKey="appointments"
              nameKey="label"
              innerRadius="64%"
              outerRadius="94%"
              paddingAngle={shares.length > 1 ? 2 : 0}
              stroke="hsl(var(--card))"
              strokeWidth={2}
              isAnimationActive={false}
              onClick={(_, index) => {
                const share = shares[index]
                if (share && isClickable(share)) onSelectGroup(share)
              }}
            >
              {shares.map((share) => (
                <Cell key={share.key} fill={colorOf(share)} cursor={isClickable(share) ? 'pointer' : 'default'} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-xs text-muted-foreground">นัดทั้งหมด</p>
            <p className="text-2xl font-semibold tabular-nums tracking-tight">{formatNumber(total)}</p>
          </div>
        </div>
      </div>

      <ul className="space-y-1">
        {shares.map((share) => (
          <li key={share.key}>
            <button
              type="button"
              disabled={!isClickable(share)}
              onClick={() => onSelectGroup(share)}
              className={cn(
                'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors',
                isClickable(share) ? 'hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring' : 'cursor-default',
              )}
              aria-label={isClickable(share) ? `${share.label} — ดูรายละเอียด` : share.label}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colorOf(share) }} aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate">{share.label}</span>
              <span className="tabular-nums text-muted-foreground">{formatNumber(share.appointments)}</span>
              <span className="w-14 text-right font-medium tabular-nums">{formatPercent(share.percentage)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
})
