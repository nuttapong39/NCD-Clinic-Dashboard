// src/components/pregnancy/AncComplianceChart.tsx
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
} from 'recharts'
import type { AncComplianceData } from '@/types/pregnancy'
import { ChartWrapper } from '@/components/ui/ChartWrapper'

interface AncComplianceChartProps {
  data: AncComplianceData[]
  loading?: boolean
}

const CHART_MARGIN = { top: 5, right: 20, left: 0, bottom: 5 }

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
}

export const AncComplianceChart = memo(function AncComplianceChart({ data, loading }: AncComplianceChartProps) {
  const isEmpty = !data || data.length === 0

  const chartData = useMemo(() => (isEmpty ? [] : data.map(item => ({
    visitCount: item.visitCount >= 5 ? '5+' : String(item.visitCount),
    patientCount: item.patientCount,
    meetsTarget: item.visitCount >= 5,
    rawVisitCount: item.visitCount,
  }))), [data, isEmpty])

  const totalAbove5 = useMemo(() =>
    isEmpty ? 0 : data.filter(d => d.visitCount >= 5).reduce((sum, d) => sum + d.patientCount, 0),
    [data, isEmpty]
  )
  const totalAll = useMemo(() => isEmpty ? 0 : data.reduce((sum, d) => sum + d.patientCount, 0), [data, isEmpty])
  const pctAbove5 = totalAll > 0 ? Math.round((totalAbove5 / totalAll) * 100) : 0

  return (
    <ChartWrapper title="การมาฝากครรภ์ (ANC)" loading={loading} isEmpty={isEmpty}>
    <div className="h-64">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          การมาฝากครรภ์ (ANC)
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 font-medium">
          5+ ครั้ง: {pctAbove5}%
        </span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" vertical={false} />
          <XAxis
            dataKey="visitCount"
            tick={{ fontSize: 12 }}
            label={{ value: 'ครั้ง', position: 'insideBottomRight', offset: -5, style: { fontSize: 11 } }}
          />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            formatter={(value: any) => [`${Number(value)} คน`, 'จำนวน']}
            contentStyle={TOOLTIP_CONTENT_STYLE}
          />
          <Bar dataKey="patientCount" name="จำนวนคนไข้" radius={[4, 4, 0, 0]} barSize={28}>
            {chartData.map((entry) => (
              <Cell
                key={entry.visitCount}
                fill={entry.meetsTarget ? '#6366f1' : '#cbd5e1'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
    </ChartWrapper>
  )
})
