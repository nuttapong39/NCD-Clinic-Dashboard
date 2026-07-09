// src/components/pregnancy/BirthWeightChart.tsx
import { memo, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts'
import type { BirthWeightData } from '@/types/pregnancy'
import { sortAndCalculatePercentages } from '@/services/pregnancyDataProcessing'
import { ChartWrapper } from '@/components/ui/ChartWrapper'

interface BirthWeightChartProps {
  data: BirthWeightData[]
  loading?: boolean
}

const COLORS: Record<string, string> = {
  'Low (<2500g)': '#ef4444',
  'Normal (2500-4000g)': '#10b981',
  'High (>4000g)': '#f59e0b',
}

const ORDER = ['Low (<2500g)', 'Normal (2500-4000g)', 'High (>4000g)']

const CHART_MARGIN = { top: 15, right: 20, left: 0, bottom: 5 }

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
}

export const BirthWeightChart = memo(function BirthWeightChart({ data, loading }: BirthWeightChartProps) {
  const isEmpty = !data || data.length === 0

  const sortedData = useMemo(
    () => (!isEmpty ? sortAndCalculatePercentages(data, ORDER, 'category') : []),
    [data, isEmpty]
  )

  return (
    <ChartWrapper title="การกระจายน้ำหนักแรกคลอด" loading={loading} isEmpty={isEmpty}>
    <div className="h-64">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          การกระจายน้ำหนักแรกคลอด
        </h3>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedData} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" vertical={false} />
          <XAxis dataKey="category" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            formatter={(value: any, _name: any, props: any) =>
              [`${Number(value)} ราย (${props.payload.percentage}%)`, 'จำนวน']
            }
            contentStyle={TOOLTIP_CONTENT_STYLE}
          />
          <Bar dataKey="count" name="จำนวน" radius={[6, 6, 0, 0]} barSize={48}>
            {sortedData.map((entry) => (
              <Cell key={entry.category} fill={COLORS[entry.category] || '#3b82f6'} />
            ))}
            <LabelList
              dataKey="percentage"
              position="top"
              formatter={(val: any) => `${val}%`}
              style={{ fontSize: 12, fontWeight: 700, fill: '#334155' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    </ChartWrapper>
  )
})
