import { memo } from 'react'
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import type { StackPoint } from '@/services/ncdMonthlyProcessing'
import { ChartLegend, ChartTooltipCard } from '@/components/ncd/chartParts'
import { FUTURE_AREA_FILL, GRID_PROPS, PREVIOUS_LINE_PROPS, X_AXIS_PROPS, Y_AXIS_PROPS, futureRange } from '@/components/ncd/chartConfig'
import { PREVIOUS_YEAR_COLOR } from '@/components/ncd/visuals'

export interface StackSeries {
  key: string
  label: string
  color: string
  /** Omitted for series that have no detail view (e.g. "คลินิกอื่น ๆ") */
  onSelect?: () => void
}

interface StackedTrendChartProps {
  points: StackPoint[]
  series: readonly StackSeries[]
  fiscalYear: number
  /** What a bar counts, e.g. "นัด" or "มาตามนัด" */
  measure: string
  ariaLabel: string
  futureNote?: string
}

/** Monthly stacked bars per series with last fiscal year's total as a dashed line (UI-TEMPLATE §8). */
export const StackedTrendChart = memo(function StackedTrendChart({
  points,
  series,
  fiscalYear,
  measure,
  ariaLabel,
  futureNote,
}: StackedTrendChartProps) {
  const future = futureRange(points)
  const previousLabel = `ปีงบ ${fiscalYear - 1}`

  const renderTooltip = ({ active, label }: TooltipContentProps) => {
    const point = points.find((candidate) => candidate.label === label)
    if (!active || !point) return null
    return (
      <ChartTooltipCard
        title={`${measure} ${point.label}`}
        rows={[
          ...series.map((item) => ({ label: item.label, value: Number(point[item.key] ?? 0), color: item.color })),
          { label: 'รวม', value: point.total, emphasis: true },
          { label: previousLabel, value: point.previousTotal, color: PREVIOUS_YEAR_COLOR, dashed: true },
        ]}
        footer={point.isFuture ? futureNote : undefined}
      />
    )
  }

  return (
    <div>
      <div className="h-72" role="img" aria-label={ariaLabel}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} barCategoryGap="28%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis {...X_AXIS_PROPS} />
            <YAxis {...Y_AXIS_PROPS} />
            {future && <ReferenceArea x1={future.x1} x2={future.x2} fill={FUTURE_AREA_FILL} fillOpacity={0.6} ifOverflow="extendDomain" />}
            <Tooltip content={renderTooltip} cursor={{ fill: 'hsl(var(--accent))', fillOpacity: 0.5 }} />
            {series.map((item, index) => (
              <Bar
                key={item.key}
                dataKey={item.key}
                name={item.label}
                stackId="series"
                fill={item.color}
                stroke="hsl(var(--card))"
                strokeWidth={1}
                maxBarSize={36}
                radius={index === series.length - 1 ? [6, 6, 0, 0] : 0}
                cursor={item.onSelect ? 'pointer' : 'default'}
                onClick={item.onSelect}
                isAnimationActive={false}
              />
            ))}
            <Line dataKey="previousTotal" name={previousLabel} stroke={PREVIOUS_YEAR_COLOR} {...PREVIOUS_LINE_PROPS} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          ...series.map((item) => ({ key: item.key, label: item.label, color: item.color })),
          { key: 'previous', label: `${measure}รวม${previousLabel}`, color: PREVIOUS_YEAR_COLOR, kind: 'dashed' as const },
          ...(future ? [{ key: 'future', label: 'เดือนที่ยังไม่ถึง', color: FUTURE_AREA_FILL, kind: 'area' as const }] : []),
        ]}
      />
    </div>
  )
})
