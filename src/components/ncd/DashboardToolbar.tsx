import { Download, RefreshCw } from 'lucide-react'
import { FiscalYearSelect } from '@/components/ui/FiscalYearSelect'
import { ToolbarButton } from '@/components/ui/ToolbarButton'
import { cn } from '@/lib/utils'

interface DashboardToolbarProps {
  fiscalYear: number
  fiscalYearChoices: readonly number[]
  onFiscalYearChange: (fiscalYear: number) => void
  isLoading: boolean
  onRefresh: () => void
  onExportCsv: () => void
  canExport: boolean
}

export function DashboardToolbar({
  fiscalYear,
  fiscalYearChoices,
  onFiscalYearChange,
  isLoading,
  onRefresh,
  onExportCsv,
  canExport,
}: DashboardToolbarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <FiscalYearSelect value={fiscalYear} options={fiscalYearChoices} onChange={onFiscalYearChange} disabled={isLoading} />
      <div className="flex flex-wrap items-center gap-2">
        <ToolbarButton onClick={onRefresh} disabled={isLoading}>
          <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} aria-hidden="true" />
          รีเฟรช
        </ToolbarButton>
        <ToolbarButton onClick={onExportCsv} disabled={!canExport} title="ดาวน์โหลดสรุปรายเดือนแยกคลินิกของปีงบที่เลือก">
          <Download className="h-4 w-4" aria-hidden="true" />
          CSV รายเดือน
        </ToolbarButton>
      </div>
    </div>
  )
}
