// src/components/pregnancy/ApgarScoreChart.tsx
import { memo, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ApgarScoreData } from '@/types/pregnancy'
import { ChartWrapper } from '@/components/ui/ChartWrapper'

interface ApgarScoreChartProps {
  data: ApgarScoreData[]
  loading?: boolean
}

const ORDER = ['0-3', '4-6', '7-10']

const CHART_MARGIN = { top: 5, right: 20, left: 0, bottom: 5 }

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid #e2e8f0',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
}

const LEGEND_WRAPPER_STYLE = { fontSize: 12 }

export const ApgarScoreChart = memo(function ApgarScoreChart({ data, loading }: ApgarScoreChartProps) {
  const isEmpty = !data || data.length === 0

  const sortedData = useMemo(
    () => (!isEmpty ? [...data].sort((a, b) => ORDER.indexOf(a.scoreRange) - ORDER.indexOf(b.scoreRange)) : []),
    [data, isEmpty]
  )

  return (
    <ChartWrapper title="Apgar Score" loading={loading} isEmpty={isEmpty}>
    <div className="h-64">
      <div className="flex items-baseline justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Apgar Score
        </h3>
        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-medium">
          ปกติ: 7-10
        </span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedData} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" vertical={false} />
          <XAxis dataKey="scoreRange" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={LEGEND_WRAPPER_STYLE}
          />
          <Bar dataKey="oneMin" name="1 นาที" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={24} />
          <Bar dataKey="fiveMin" name="5 นาที" fill="#10b981" radius={[4, 4, 0, 0]} barSize={24} />
        </BarChart>
      </ResponsiveContainer>
    </div>
    </ChartWrapper>
  )
})
