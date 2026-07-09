// src/components/pregnancy/DeliveryTrendChart.tsx
import { memo, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DeliveryTrendData } from '@/types/pregnancy'
import { ChartWrapper } from '@/components/ui/ChartWrapper'

interface DeliveryTrendChartProps {
  data: DeliveryTrendData[]
  loading?: boolean
}

const CHART_MARGIN = { top: 5, right: 20, left: 0, bottom: 5 }

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
}

const TOOLTIP_LABEL_STYLE = { fontWeight: 'bold', marginBottom: 4 }

export const DeliveryTrendChart = memo(function DeliveryTrendChart({ data, loading }: DeliveryTrendChartProps) {
  const isEmpty = !data || data.length === 0
  const total = useMemo(() => (!isEmpty ? data.reduce((sum, d) => sum + d.deliveries, 0) : 0), [data, isEmpty])

  return (
    <ChartWrapper title="แนวโน้มการคลอด" loading={loading} isEmpty={isEmpty}>
    <div className="h-64">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          แนวโน้มการคลอด
        </h3>
        <span className="text-sm text-slate-500 dark:text-slate-400">
          รวม <strong className="text-slate-700 dark:text-slate-200">{total}</strong> ราย
        </span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={CHART_MARGIN}>
          <defs>
            <linearGradient id="deliveryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
          />
          <Area
            type="monotone"
            dataKey="deliveries"
            name="การคลอด"
            stroke="#3b82f6"
            strokeWidth={2.5}
            fill="url(#deliveryGradient)"
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#3b82f6', stroke: '#fff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    </ChartWrapper>
  )
})
