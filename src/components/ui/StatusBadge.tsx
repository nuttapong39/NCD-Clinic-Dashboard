import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  value: string
  positiveValues?: string[]
  negativeValues?: string[]
}

const DEFAULT_POSITIVE = ['ทันเวลา', 'ผ่านเกณฑ์', 'ครบ', 'ปกติ']
const DEFAULT_NEGATIVE = ['ช้ากว่ากำหนด', 'ไม่ผ่าน', 'ไม่ครบ', 'เสี่ยง']

export function StatusBadge({
  value,
  positiveValues = DEFAULT_POSITIVE,
  negativeValues = DEFAULT_NEGATIVE,
}: StatusBadgeProps) {
  const isPositive = positiveValues.includes(value)
  const isNegative = negativeValues.includes(value)
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        isPositive && 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        isNegative && 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        !isPositive && !isNegative && 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      )}
    >
      {value}
    </span>
  )
}
