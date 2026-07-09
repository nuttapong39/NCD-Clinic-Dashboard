// src/components/pregnancy/GaDistributionChart.tsx
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
import type { GaDistributionData } from '@/types/pregnancy'
import { sortAndCalculatePercentages } from '@/services/pregnancyDataProcessing'
import { ChartWrapper } from '@/components/ui/ChartWrapper'

interface GaDistributionChartProps {
  data: GaDistributionData[]
  loading?: boolean
}

const ORDER = ['1st Trimester (<12w)', '2nd Trimester (12-27w)', '3rd Trimester (28-36w)', 'Term (37w+)']

const GA_COLORS: Record<string, string> = {
  '1st Trimester (<12w)': '#60a5fa',
  '2nd Trimester (12-27w)': '#34d399',
  '3rd Trimester (28-36w)': '#fbbf24',
  'Term (37w+)': '#f472b6',
}

const CHART_MARGIN = { top: 5, right: 40, left: 80, bottom: 5 }

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
}

export const GaDistributionChart = memo(function GaDistributionChart({ data, loading }: GaDistributionChartProps) {
  const isEmpty = !data || data.length === 0

  const sortedData = useMemo(
    () => (!isEmpty ? sortAndCalculatePercentages(data, ORDER, 'category') : []),
    [data, isEmpty]
  )

  return (
    <ChartWrapper title="การกระจายตามอายุครรภ์" loading={loading} isEmpty={isEmpty}>
    <div className="h-64">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        การกระจายตามอายุครรภ์
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedData} layout="vertical" margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis dataKey="category" type="category" tick={{ fontSize: 10 }} width={80} />
          <Tooltip
            formatter={(value: any, _name: any, props: any) =>
              [`${Number(value)} ราย (${props.payload.percentage}%)`, 'จำนวน']
            }
            contentStyle={TOOLTIP_CONTENT_STYLE}
          />
          <Bar dataKey="count" name="จำนวน" radius={[0, 6, 6, 0]} barSize={20}>
            {sortedData.map((entry) => (
              <Cell key={entry.category} fill={GA_COLORS[entry.category] || '#3b82f6'} />
            ))}
            <LabelList
              dataKey="percentage"
              position="right"
              formatter={(val: any) => `${val}%`}
              style={{ fontSize: 11, fontWeight: 600, fill: '#64748b' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    </ChartWrapper>
  )
})
