// Shared chart configuration — UI-TEMPLATE §8 (recessive grid and axes)
import { formatCompact } from '@/utils/formatters'
import type { MonthPoint } from '@/types/ncd'

export const AXIS_TICK = { fontSize: 11, fill: 'hsl(var(--muted-foreground))' } as const

export const GRID_PROPS = {
  strokeDasharray: '3 6',
  stroke: 'hsl(var(--border))',
  vertical: false,
} as const

export const X_AXIS_PROPS = {
  dataKey: 'label',
  tick: AXIS_TICK,
  axisLine: false,
  tickLine: false,
  interval: 'preserveStartEnd',
  minTickGap: 6,
  tickMargin: 8,
} as const

export const Y_AXIS_PROPS = {
  tick: AXIS_TICK,
  axisLine: false,
  tickLine: false,
  width: 44,
  allowDecimals: false,
  tickFormatter: (value: number) => formatCompact(value),
} as const

export const PREVIOUS_LINE_PROPS = {
  type: 'monotone',
  strokeDasharray: '5 5',
  strokeWidth: 2,
  strokeOpacity: 0.55,
  dot: false,
  activeDot: false,
  isAnimationActive: false,
} as const

/** True when any point has a non-zero value for `key` (e.g. last year's line has data). */
export function hasAnyValue(points: readonly Record<string, unknown>[], key: string): boolean {
  return points.some((point) => Number(point[key] ?? 0) > 0)
}

export const FUTURE_AREA_FILL = 'hsl(var(--muted))'

/** Category-axis bounds of the months that have not started yet, if any. */
export function futureRange(points: readonly MonthPoint[]): { x1: string; x2: string } | null {
  const future = points.filter((point) => point.isFuture)
  if (future.length === 0) return null
  return { x1: future[0].label, x2: future[future.length - 1].label }
}
