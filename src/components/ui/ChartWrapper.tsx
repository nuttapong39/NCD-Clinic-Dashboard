import { cn } from '@/lib/utils'

interface ChartWrapperProps {
  title: string
  loading?: boolean
  isEmpty?: boolean
  emptyMessage?: string
  height?: string
  children: React.ReactNode
}

export function ChartWrapper({
  title,
  loading,
  isEmpty,
  emptyMessage = 'ไม่มีข้อมูลในช่วงเวลานี้ ลองเปลี่ยนช่วงวันที่หรือรีเฟรชข้อมูล',
  height = 'h-64',
  children,
}: ChartWrapperProps) {
  if (loading) {
    return <div className={cn(height, 'rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse')} />
  }
  if (isEmpty) {
    return (
      <div className={height}>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">{title}</h3>
        <div className="h-48 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">{emptyMessage}</p>
        </div>
      </div>
    )
  }
  return <>{children}</>
}
