// src/components/pregnancy/DeliveryTypeChart.tsx
import { memo, useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { DeliveryTypeData } from '@/types/pregnancy'
import { ChartWrapper } from '@/components/ui/ChartWrapper'

interface DeliveryTypeChartProps {
  data: DeliveryTypeData[]
  loading?: boolean
}

const COLORS: Record<string, string> = {
  'Normal': '#10b981',
  'C-Section': '#f43f5e',
  'Vacuum': '#f59e0b',
  'Forceps': '#8b5cf6',
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
}

export const DeliveryTypeChart = memo(function DeliveryTypeChart({ data, loading }: DeliveryTypeChartProps) {
  const isEmpty = !data || data.length === 0

  const chartData = useMemo(() => (isEmpty ? [] : data.map((item, index) => ({
    name: item.type || 'อื่นๆ',
    value: item.count,
    percentage: item.percentage,
    color: COLORS[item.type] || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }))), [data, isEmpty])

  const total = useMemo(() => chartData.reduce((sum, d) => sum + d.value, 0), [chartData])

  return (
    <ChartWrapper title="ประเภทการคลอด" loading={loading} isEmpty={isEmpty}>
    <div className="h-64">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        ประเภทการคลอด
      </h3>
      <div className="flex items-center h-48">
        {/* Donut Chart */}
        <div className="w-1/2 h-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any, name: any) => [`${Number(value)} ราย`, name]}
                contentStyle={TOOLTIP_CONTENT_STYLE}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{total}</span>
            <span className="text-xs text-slate-400">ราย</span>
          </div>
        </div>
        {/* Legend */}
        <div className="w-1/2 space-y-2 pl-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex-shrink-0">
                    {item.percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-0.5">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </ChartWrapper>
  )
})
