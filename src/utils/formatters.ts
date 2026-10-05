// =============================================================================
// Display formatting (UI-TEMPLATE §9.5)
// =============================================================================

import { format, parseISO } from 'date-fns'
import { th } from 'date-fns/locale'
import { BE_OFFSET } from '@/utils/fiscalYear'

export const NO_VALUE = '—'

const numberFormat = new Intl.NumberFormat('en-US')
const oneDecimal = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })

export function formatNumber(value: number | null): string {
  return value === null ? NO_VALUE : numberFormat.format(value)
}

export function formatPercent(value: number | null): string {
  return value === null ? NO_VALUE : `${oneDecimal.format(value)}%`
}

export function formatChange(change: number): string {
  const sign = change > 0 ? '+' : ''
  return `${sign}${oneDecimal.format(change)}%`
}

/** `2025-10-01` → `1 ต.ค. 2568` */
export function formatThaiDate(date: Date | string): string {
  const value = typeof date === 'string' ? parseISO(date) : date
  return `${format(value, 'd MMM', { locale: th })} ${value.getFullYear() + BE_OFFSET}`
}

/** Date or `HH:mm[:ss]` string → `HH:mm น.` */
export function formatTime(time: Date | string | null): string {
  if (time === null || time === '') return NO_VALUE
  const hhmm = typeof time === 'string' ? time.slice(0, 5) : format(time, 'HH:mm')
  return `${hhmm} น.`
}

/** Axis labels: `12500` → `12.5k`, `1300000` → `1.3M` */
export function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${oneDecimal.format(value / 1_000_000)}M`
  if (Math.abs(value) >= 1_000) return `${oneDecimal.format(value / 1_000)}k`
  return String(value)
}
