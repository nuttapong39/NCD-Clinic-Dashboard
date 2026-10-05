import type { ReactNode } from 'react'
import { attendanceRate, type SubjectYearSummary } from '@/services/ncdMonthlyProcessing'
import { NO_VALUE, formatNumber, formatPercent } from '@/utils/formatters'
import type { AppointmentPoint } from '@/types/ncd'
import { cn } from '@/lib/utils'

interface MonthlyDetailTableProps {
  current: readonly AppointmentPoint[]
  previous: readonly AppointmentPoint[]
  summary: SubjectYearSummary
  /** Rights groups only know attended appointments */
  attendanceOnly: boolean
  fiscalYear: number
}

/** Month-by-month figures; months that have not started show — (UI-TEMPLATE §7.9). */
export function MonthlyDetailTable({ current, previous, summary, attendanceOnly, fiscalYear }: MonthlyDetailTableProps) {
  const due = (point: AppointmentPoint, value: number) => (point.isFuture ? NO_VALUE : formatNumber(value))
  const headers = attendanceOnly
    ? ['มาตามนัด', `ปีงบ ${fiscalYear - 1}`]
    : ['นัด', 'มาตามนัด', 'ขาดนัด', 'ยังไม่มา / ล่วงหน้า', 'อัตรามาตามนัด', `มาตามนัด ปีงบ ${fiscalYear - 1}`]

  return (
    <section aria-label="ตารางรายเดือน">
      <h3 className="mb-3 text-sm font-semibold tracking-tight">รายละเอียดรายเดือน</h3>
      <div className="-mx-2 overflow-x-auto px-2">
        <table className={cn('w-full border-separate border-spacing-0 text-sm', attendanceOnly ? 'min-w-[320px]' : 'min-w-[640px]')}>
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th scope="col" className="border-b px-3 py-2 text-left font-medium">เดือน</th>
              {headers.map((header) => (
                <th key={header} scope="col" className="border-b px-3 py-2 text-right font-medium">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.map((point, index) => (
              <tr key={point.month} data-future={point.isFuture || undefined} className={cn('hover:bg-accent/40', point.isFuture && 'text-muted-foreground/50')}>
                <th scope="row" className="border-b border-border/60 px-3 py-2 text-left font-medium">{point.label}</th>
                {attendanceOnly ? (
                  <>
                    <Cell>{due(point, point.came)}</Cell>
                    <Cell muted>{formatNumber(previous[index].came)}</Cell>
                  </>
                ) : (
                  <>
                    <Cell>{formatNumber(point.appointments)}</Cell>
                    <Cell>{due(point, point.came)}</Cell>
                    <Cell>{due(point, point.missed)}</Cell>
                    <Cell>{formatNumber(point.notArrivedToday + point.upcoming)}</Cell>
                    <Cell>{point.isFuture ? NO_VALUE : formatPercent(attendanceRate(point))}</Cell>
                    <Cell muted>{formatNumber(previous[index].came)}</Cell>
                  </>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-accent/50 font-medium">
              <th scope="row" className="rounded-l-xl px-3 py-2 text-left">
                รวม <span className="text-xs font-normal text-muted-foreground">({summary.elapsed} เดือนที่ผ่านมา)</span>
              </th>
              {attendanceOnly ? (
                <>
                  <Cell className="text-primary">{formatNumber(summary.toDate.came)}</Cell>
                  <Cell className="rounded-r-xl">{formatNumber(summary.previousToDate.came)}</Cell>
                </>
              ) : (
                <>
                  <Cell>{formatNumber(summary.toDate.appointments)}</Cell>
                  <Cell className="text-primary">{formatNumber(summary.toDate.came)}</Cell>
                  <Cell>{formatNumber(summary.toDate.missed)}</Cell>
                  <Cell>{formatNumber(summary.toDate.notArrivedToday + summary.toDate.upcoming)}</Cell>
                  <Cell>{formatPercent(summary.attendanceRate)}</Cell>
                  <Cell className="rounded-r-xl">{formatNumber(summary.previousToDate.came)}</Cell>
                </>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  )
}

function Cell({ children, muted, className }: { children: ReactNode; muted?: boolean; className?: string }) {
  return (
    <td className={cn('border-b border-border/60 px-3 py-2 text-right tabular-nums', muted && 'text-muted-foreground', className)}>
      {children}
    </td>
  )
}
