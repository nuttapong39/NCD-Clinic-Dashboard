// =============================================================================
// NCD Clinic Dashboard — Hero → Toolbar → วันนี้ → ปีงบประมาณ → หมายเหตุ
// =============================================================================

import { Suspense, lazy, useCallback, useMemo, useState } from 'react'
import { CalendarCheck, CalendarRange } from 'lucide-react'
import { useBmsSessionContext } from '@/contexts/BmsSessionContext'
import { useNcdDashboard } from '@/hooks/useNcdDashboard'
import { NcdHero } from '@/components/ncd/NcdHero'
import { DashboardToolbar } from '@/components/ncd/DashboardToolbar'
import { TodaySummaryCards } from '@/components/ncd/TodaySummaryCards'
import { NotArrivedTable } from '@/components/ncd/NotArrivedTable'
import { SectionCard } from '@/components/ui/SectionCard'
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/StateViews'
import { MONTHLY_CSV_COLUMNS, clinicSeriesGroups, listClinics, monthlyCsvRows } from '@/services/ncdMonthlyProcessing'
import { downloadCsv, toCsv } from '@/utils/csv'
import { fiscalMonths } from '@/utils/fiscalYear'
import { formatThaiDate, formatTime } from '@/utils/formatters'
import type { DetailSubject } from '@/types/ncd'

// Recharts-heavy parts load separately so today's cards and patient list appear first
const YearlyOverview = lazy(() => import('@/components/ncd/YearlyOverview').then((module) => ({ default: module.YearlyOverview })))
const TrendDetailModal = lazy(() => import('@/components/ncd/TrendDetailModal').then((module) => ({ default: module.TrendDetailModal })))

export default function NcdDashboard() {
  const { session } = useBmsSessionContext()
  const dashboard = useNcdDashboard()
  const { today, yearly, fiscalYear, asOf } = dashboard

  const [selectedClinic, setSelectedClinic] = useState<string | null>(null)
  const [detail, setDetail] = useState<DetailSubject | null>(null)

  const groups = useMemo(() => clinicSeriesGroups(listClinics(yearly.clinicRows)), [yearly.clinicRows])
  const yearMonths = useMemo(() => new Set(fiscalMonths(fiscalYear)), [fiscalYear])
  const hasYearData = yearly.clinicRows.some((row) => yearMonths.has(row.month))

  const exportMonthlyCsv = useCallback(() => {
    downloadCsv(`ncd-clinic-fy${fiscalYear}.csv`, toCsv(MONTHLY_CSV_COLUMNS, monthlyCsvRows(yearly.clinicRows, fiscalYear)))
  }, [fiscalYear, yearly.clinicRows])

  const todayLabel = formatThaiDate(asOf)
  const updatedLabel = today.lastUpdatedAt ? ` · อัปเดตล่าสุด ${formatTime(today.lastUpdatedAt)}` : ''
  const isLoading = today.isLoading || yearly.isLoading

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
      <NcdHero fiscalYear={fiscalYear} hospitalName={session?.userInfo.location ?? null} />

      <DashboardToolbar
        fiscalYear={fiscalYear}
        fiscalYearChoices={dashboard.fiscalYearChoices}
        onFiscalYearChange={dashboard.setFiscalYear}
        isLoading={isLoading}
        onRefresh={dashboard.refresh}
        onExportCsv={exportMonthlyCsv}
        canExport={!yearly.isLoading && hasYearData}
      />

      <SectionCard
        title="นัดวันนี้"
        description={`${todayLabel}${updatedLabel} · คลิกการ์ดคลินิกเพื่อกรองรายชื่อผู้ป่วยที่ยังไม่มา`}
        icon={<CalendarCheck className="h-5 w-5" />}
      >
        {today.error ? (
          <ErrorState message={today.error} onRetry={dashboard.refresh} />
        ) : today.summary === null ? (
          <LoadingState message="กำลังดึงนัดวันนี้…" />
        ) : today.summary.clinics.length === 0 ? (
          <EmptyState
            title="ไม่พบคลินิกเบาหวานหรือความดัน"
            description="ยังไม่มีคลินิกที่ผูกกับประเภทคลินิกรหัส สธ. 001 (เบาหวาน) หรือ 002 (ความดัน) ใน HOSxP ของโรงพยาบาลนี้ · ติดต่อผู้ดูแลระบบเพื่อตั้งค่าประเภทคลินิก"
          />
        ) : (
          <TodaySummaryCards summary={today.summary} selectedClinic={selectedClinic} onSelectClinic={setSelectedClinic} />
        )}
      </SectionCard>

      {today.summary && today.summary.clinics.length > 0 && !today.error && (
        <NotArrivedTable
          patients={today.notArrived}
          clinics={today.summary.clinics}
          limitReached={today.notArrivedLimitReached}
          selectedClinic={selectedClinic}
          onSelectClinic={setSelectedClinic}
          dateLabel={todayLabel}
          fileDate={asOf.toISOString().slice(0, 10)}
        />
      )}

      <div className="flex items-center gap-3 pt-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-primary" aria-hidden="true">
          <CalendarRange className="h-4 w-4" />
        </span>
        <h2 className="text-lg font-semibold tracking-tight">ภาพรวมปีงบประมาณ {fiscalYear}</h2>
      </div>

      {yearly.error ? (
        <SectionCard title="เกิดข้อผิดพลาด" icon={<CalendarRange className="h-5 w-5" />}>
          <ErrorState message={yearly.error} onRetry={dashboard.refresh} />
        </SectionCard>
      ) : yearly.isLoading ? (
        <SectionCard title="กำลังโหลดข้อมูล" icon={<CalendarRange className="h-5 w-5" />}>
          <LoadingState message={`กำลังดึงนัดรายเดือนของปีงบประมาณ ${fiscalYear} และ ${fiscalYear - 1}…`} />
        </SectionCard>
      ) : !hasYearData ? (
        <SectionCard title="ไม่พบข้อมูล" icon={<CalendarRange className="h-5 w-5" />}>
          <EmptyState
            title={`ไม่มีนัดคลินิกเบาหวานหรือความดันในปีงบประมาณ ${fiscalYear}`}
            description="อาจยังไม่มีการนัดในช่วงนี้ หรือคลินิกยังไม่ได้ผูกประเภทคลินิก · ลองดูปีงบก่อนหน้า"
            action={
              dashboard.fiscalYearChoices.includes(fiscalYear - 1)
                ? { label: `ดูปีงบประมาณ ${fiscalYear - 1}`, onClick: () => dashboard.setFiscalYear(fiscalYear - 1) }
                : undefined
            }
          />
        </SectionCard>
      ) : (
        <Suspense fallback={<LoadingState message="กำลังเตรียมกราฟ…" />}>
          <YearlyOverview
            clinicRows={yearly.clinicRows}
            rightsRows={yearly.rightsRows}
            groups={groups}
            fiscalYear={fiscalYear}
            asOf={asOf}
            onOpenDetail={setDetail}
          />
        </Suspense>
      )}

      <p className="pt-2 text-center text-xs text-muted-foreground">
        ข้อมูลอ่านอย่างเดียวจาก HOSxP ผ่าน BMS Session · นับเฉพาะนัดที่ไม่ถูกยกเลิก · มาตามนัด = มีการมารับบริการตรงวันนัด ·
        มีรายชื่อผู้ป่วยเพื่อการติดตามนัดเท่านั้น
      </p>

      {detail && (
        <Suspense fallback={null}>
          <TrendDetailModal
            subject={detail}
            onClose={() => setDetail(null)}
            clinicRows={yearly.clinicRows}
            rightsRows={yearly.rightsRows}
            groups={groups}
            fiscalYear={fiscalYear}
            asOf={asOf}
          />
        </Suspense>
      )}
    </div>
  )
}
