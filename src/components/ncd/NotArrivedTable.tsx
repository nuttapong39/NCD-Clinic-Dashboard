import { useMemo, useState } from 'react'
import { Download, Search, TriangleAlert, UserRoundX } from 'lucide-react'
import { SectionCard } from '@/components/ui/SectionCard'
import { ToolbarButton } from '@/components/ui/ToolbarButton'
import { EmptyState } from '@/components/ui/StateViews'
import { DISEASE_VISUALS } from '@/components/ncd/visuals'
import { NOT_ARRIVED_LIST_LIMIT } from '@/services/ncdQueries'
import { filterNotArrived } from '@/services/ncdTodayProcessing'
import { notArrivedExport } from '@/services/ncdExports'
import { downloadCsv } from '@/utils/csv'
import { NO_VALUE, formatNumber, formatTime } from '@/utils/formatters'
import type { ClinicToday, NotArrivedPatient } from '@/types/ncd'

interface NotArrivedTableProps {
  patients: readonly NotArrivedPatient[]
  clinics: readonly ClinicToday[]
  limitReached: boolean
  selectedClinic: string | null
  onSelectClinic: (clinicCode: string | null) => void
  dateLabel: string
  listDate: Date
}

export function NotArrivedTable({ patients, clinics, limitReached, selectedClinic, onSelectClinic, dateLabel, listDate }: NotArrivedTableProps) {
  const [query, setQuery] = useState('')
  const visible = useMemo(
    () => filterNotArrived(patients, { query, clinicCode: selectedClinic }),
    [patients, query, selectedClinic],
  )

  const exportCsv = () => {
    const file = notArrivedExport(visible, listDate)
    downloadCsv(file.filename, file.csv)
  }

  const clearFilters = () => {
    setQuery('')
    onSelectClinic(null)
  }

  return (
    <SectionCard
      title="ผู้ป่วยที่มีนัดวันนี้แต่ยังไม่มา"
      description={`${dateLabel} · ${formatNumber(patients.length)} คน · ใช้รายชื่อนี้โทรติดตามผู้ป่วย · ผู้ป่วยที่นัดหลายคลินิกแสดงแถวเดียว`}
      icon={<UserRoundX className="h-5 w-5" />}
      aside={
        <ToolbarButton onClick={exportCsv} disabled={visible.length === 0}>
          <Download className="h-4 w-4" aria-hidden="true" />
          CSV รายชื่อ
        </ToolbarButton>
      }
    >
      {limitReached && (
        <p role="alert" className="mb-4 flex gap-2 rounded-xl border border-amber-100 bg-amber-50 p-3 text-xs text-amber-700">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          แสดง {formatNumber(NOT_ARRIVED_LIST_LIMIT)} นัดแรกเท่านั้น รายชื่ออาจไม่ครบ · กรองตามคลินิกหรือดูรายชื่อเต็มในโปรแกรม HOSxP
        </p>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ค้นหา HN หรือชื่อผู้ป่วย"
            aria-label="ค้นหา HN หรือชื่อผู้ป่วย"
            className="w-full rounded-xl border bg-card py-2 pl-9 pr-3 text-sm focus:border-primary/60 focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        </label>
        <select
          aria-label="กรองตามคลินิก"
          value={selectedClinic ?? ''}
          onChange={(event) => onSelectClinic(event.target.value || null)}
          className="rounded-xl border bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">ทุกคลินิก</option>
          {clinics.map((clinic) => (
            <option key={clinic.clinicCode} value={clinic.clinicCode}>
              {clinic.clinicName}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground" aria-live="polite">
          แสดง {formatNumber(visible.length)} จาก {formatNumber(patients.length)} คน
        </span>
      </div>

      {patients.length === 0 ? (
        <EmptyState title="ผู้ป่วยมาครบทุกนัดแล้ว" description="ไม่มีผู้ป่วยที่มีนัดวันนี้และยังไม่มารับบริการ · กดรีเฟรชเพื่อตรวจสอบอีกครั้งภายหลัง" />
      ) : visible.length === 0 ? (
        <EmptyState
          title="ไม่พบผู้ป่วยที่ตรงกับการค้นหา"
          description="ลองเปลี่ยนคำค้นหาหรือเลือกทุกคลินิก"
          action={{ label: 'ล้างตัวกรอง', onClick: clearFilters }}
        />
      ) : (
        <div className="-mx-2 max-h-[480px] overflow-auto px-2">
          <table className="w-full min-w-[720px] border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="text-xs text-muted-foreground">
                {['เวลานัด', 'HN', 'ชื่อ-สกุล', 'คลินิกที่นัด', 'แพทย์', 'หมายเหตุ'].map((header) => (
                  <th key={header} scope="col" className="border-b px-3 py-2 text-left font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((patient) => (
                <tr key={patient.hn} className="hover:bg-accent/40">
                  <td className="whitespace-nowrap border-b border-border/60 px-3 py-2 tabular-nums">{formatTime(patient.appointmentTime)}</td>
                  <td className="whitespace-nowrap border-b border-border/60 px-3 py-2 font-mono text-xs">{patient.hn}</td>
                  <th scope="row" className="border-b border-border/60 px-3 py-2 text-left font-medium">{patient.patientName}</th>
                  <td className="border-b border-border/60 px-3 py-2">
                    <span className="flex flex-wrap gap-1">
                      {patient.clinics.map((clinic) => (
                        <span key={clinic.clinicCode} className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 text-xs">
                          <span className={`h-2 w-2 rounded-full ${DISEASE_VISUALS[clinic.diseaseKey].dot}`} aria-hidden="true" />
                          {clinic.clinicName}
                        </span>
                      ))}
                    </span>
                  </td>
                  <td className="border-b border-border/60 px-3 py-2 text-muted-foreground">{patient.doctor ?? NO_VALUE}</td>
                  <td className="border-b border-border/60 px-3 py-2 text-xs text-muted-foreground">{patient.notes.join(' · ') || NO_VALUE}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  )
}
