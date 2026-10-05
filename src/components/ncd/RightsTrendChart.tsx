import { memo } from 'react'
import { Bar, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { RIGHTS_GROUPS } from '@/services/ncdCategories'
import type { StackPoint } from '@/services/ncdMonthlyProcessing'
import type { RightsGroupKey } from '@/types/ncd'
import { ChartLegend, ChartTooltipCard } from '@/components/ncd/chartParts'
import { FUTURE_AREA_FILL, GRID_PROPS, PREVIOUS_LINE_PROPS, X_AXIS_PROPS, Y_AXIS_PROPS, futureRange } from '@/components/ncd/chartConfig'
import { PREVIOUS_YEAR_COLOR, RIGHTS_COLORS } from '@/components/ncd/visuals'

interface RightsTrendChartProps {
  points: StackPoint[]
  fiscalYear: number
  onSelectGroup: (group: RightsGroupKey) => void
}

/** Attended appointments per month stacked by rights group. */
export const RightsTrendChart = memo(function RightsTrendChart({ points, fiscalYear, onSelectGroup }: RightsTrendChartProps) {
  const future = futureRange(points)

  const renderTooltip = ({ active, label }: TooltipContentProps) => {
    const point = points.find((candidate) => candidate.label === label)
    if (!active || !point) return null
    return (
      <ChartTooltipCard
        title={`มาตามนัด ${point.label}`}
        rows={[
          ...RIGHTS_GROUPS.map((group) => ({ label: group.label, value: Number(point[group.key] ?? 0), color: RIGHTS_COLORS[group.key] })),
          { label: 'รวม', value: point.total, emphasis: true },
          { label: `ปีงบ ${fiscalYear - 1}`, value: point.previousTotal, color: PREVIOUS_YEAR_COLOR, dashed: true },
        ]}
      />
    )
  }

  return (
    <div>
      <div className="h-72" role="img" aria-label={`กราฟแท่งซ้อนจำนวนนัดที่มาตามนัดรายเดือนแยกตามกลุ่มสิทธิ ปีงบประมาณ ${fiscalYear}`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} barCategoryGap="28%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid {...GRID_PROPS} />
            <XAxis {...X_AXIS_PROPS} />
            <YAxis {...Y_AXIS_PROPS} />
            {future && <ReferenceArea x1={future.x1} x2={future.x2} fill={FUTURE_AREA_FILL} fillOpacity={0.6} ifOverflow="extendDomain" />}
            <Tooltip content={renderTooltip} cursor={{ fill: 'hsl(var(--accent))', fillOpacity: 0.5 }} />
            {RIGHTS_GROUPS.map((group, index) => (
              <Bar
                key={group.key}
                dataKey={group.key}
                name={group.label}
                stackId="rights"
                fill={RIGHTS_COLORS[group.key]}
                stroke="hsl(var(--card))"
                strokeWidth={1}
                maxBarSize={36}
                radius={index === RIGHTS_GROUPS.length - 1 ? [6, 6, 0, 0] : 0}
                cursor="pointer"
                onClick={() => onSelectGroup(group.key)}
                isAnimationActive={false}
              />
            ))}
            <Line dataKey="previousTotal" name={`ปีงบ ${fiscalYear - 1}`} stroke={PREVIOUS_YEAR_COLOR} {...PREVIOUS_LINE_PROPS} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <ChartLegend
        items={[
          ...RIGHTS_GROUPS.map((group) => ({ key: group.key, label: group.label, color: RIGHTS_COLORS[group.key] })),
          { key: 'previous', label: `รวมปีงบ ${fiscalYear - 1}`, color: PREVIOUS_YEAR_COLOR, kind: 'dashed' as const },
        ]}
      />
    </div>
  )
})
