import { memo } from 'react'
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import type { StackPoint } from '@/services/ncdMonthlyProcessing'
import { OTHER_CLINICS_KEY } from '@/services/ncdMonthlyProcessing'
import type { ClinicSeriesGroup } from '@/types/ncd'
import { ChartLegend, ChartTooltipCard } from '@/components/ncd/chartParts'
import { FUTURE_AREA_FILL, GRID_PROPS, PREVIOUS_LINE_PROPS, X_AXIS_PROPS, Y_AXIS_PROPS, futureRange } from '@/components/ncd/chartConfig'
import { PREVIOUS_YEAR_COLOR, clinicSeriesColor } from '@/components/ncd/visuals'

interface ClinicTrendChartProps {
  points: StackPoint[]
  groups: readonly ClinicSeriesGroup[]
  fiscalYear: number
  onSelectGroup: (group: ClinicSeriesGroup) => void
}

/** Monthly appointments stacked by clinic, with last fiscal year's total as a dashed line. */
export const ClinicTrendChart = memo(function ClinicTrendChart({ points, groups, fiscalYear, onSelectGroup }: ClinicTrendChartProps) {
  const future = futureRange(points)

  const renderTooltip = ({ active, label }: TooltipContentProps) => {
    const point = points.find((candidate) => candidate.label === label)
    if (!active || !point) return null
    return (
      <ChartTooltipCard
        title={`นัด ${point.label}`}
        rows={[
          ...groups.map((group, index) => ({
            label: group.label,
            value: Number(point[group.key] ?? 0),
            color: clinicSeriesColor(index, group.key),
          })),
          { label: 'รวม', value: point.total, emphasis: true },
          { label: `ปีงบ ${fiscalYear - 1}`, value: point.previousTotal, color: PREVIOUS_YEAR_COLOR, dashed: true },
        ]}
        footer={point.isFuture ? 'เดือนที่ยังไม่ถึง · ตัวเลขคือนัดล่วงหน้า' : undefined}
      />
    )
  }

  return (
    <div>
      <div className="h-72" role="img" aria-label={`กราฟแท่งซ้อนจำนวนนัดรายเดือนแยกตามคลินิก ปีงบประมาณ ${fiscalYear} เทียบปีงบประมาณ ${fiscalYear - 1}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} barCategoryGap="28%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis {...X_AXIS_PROPS} />
            <YAxis {...Y_AXIS_PROPS} />
            {future && <ReferenceArea x1={future.x1} x2={future.x2} fill={FUTURE_AREA_FILL} fillOpacity={0.6} ifOverflow="extendDomain" />}
            <Tooltip content={renderTooltip} cursor={{ fill: 'hsl(var(--accent))', fillOpacity: 0.5 }} />
            {groups.map((group, index) => {
              const clickable = group.key !== OTHER_CLINICS_KEY
              return (
                <Bar
                  key={group.key}
                  dataKey={group.key}
                  name={group.label}
                  stackId="clinics"
                  fill={clinicSeriesColor(index, group.key)}
                  stroke="hsl(var(--card))"
                  strokeWidth={1}
                  maxBarSize={36}
                  radius={index === groups.length - 1 ? [6, 6, 0, 0] : 0}
                  cursor={clickable ? 'pointer' : 'default'}
                  onClick={clickable ? () => onSelectGroup(group) : undefined}
                  isAnimationActive={false}
                />
              )
            })}
            <Line dataKey="previousTotal" name={`ปีงบ ${fiscalYear - 1}`} stroke={PREVIOUS_YEAR_COLOR} {...PREVIOUS_LINE_PROPS} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          ...groups.map((group, index) => ({ key: group.key, label: group.label, color: clinicSeriesColor(index, group.key) })),
          { key: 'previous', label: `นัดรวมปีงบ ${fiscalYear - 1}`, color: PREVIOUS_YEAR_COLOR, kind: 'dashed' as const },
          ...(future ? [{ key: 'future', label: 'เดือนที่ยังไม่ถึง', color: FUTURE_AREA_FILL, kind: 'area' as const }] : []),
        ]}
      />
    </div>
  )
})
