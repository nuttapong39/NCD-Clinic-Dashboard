import { useMemo } from 'react'
import { BarChart3, PieChart, ShieldCheck } from 'lucide-react'
import { SectionCard } from '@/components/ui/SectionCard'
import { EmptyState } from '@/components/ui/StateViews'
import { DiseaseCards } from '@/components/ncd/DiseaseCards'
import { StackedTrendChart, type StackSeries } from '@/components/ncd/StackedTrendChart'
import { hasAnyValue } from '@/components/ncd/chartConfig'
import { ClinicShareDonut } from '@/components/ncd/ClinicShareDonut'
import { RIGHTS_COLORS, clinicSeriesColor } from '@/components/ncd/visuals'
import { RIGHTS_GROUPS } from '@/services/ncdCategories'
import { OTHER_CLINICS_KEY, buildClinicStackSeries, buildRightsSeries, clinicShare } from '@/services/ncdMonthlyProcessing'
import type { ClinicSeriesGroup, DetailSubject, MonthlyClinicRow, MonthlyRightsRow } from '@/types/ncd'

interface YearlyOverviewProps {
  clinicRows: readonly MonthlyClinicRow[]
  rightsRows: readonly MonthlyRightsRow[]
  groups: readonly ClinicSeriesGroup[]
  fiscalYear: number
  asOf: Date
  onOpenDetail: (subject: DetailSubject) => void
}

export function YearlyOverview({ clinicRows, rightsRows, groups, fiscalYear, asOf, onOpenDetail }: YearlyOverviewProps) {
  const clinicPoints = useMemo(() => buildClinicStackSeries(clinicRows, fiscalYear, asOf, groups), [clinicRows, fiscalYear, asOf, groups])
  const comparedWith = hasAnyValue(clinicPoints, 'previousTotal') ? ` เทียบนัดรวมของปีงบ ${fiscalYear - 1}` : ''
  const shares = useMemo(() => clinicShare(clinicRows, fiscalYear, groups), [clinicRows, fiscalYear, groups])
  const rightsPoints = useMemo(() => buildRightsSeries(rightsRows, fiscalYear, asOf), [rightsRows, fiscalYear, asOf])
  const hasRights = rightsPoints.some((point) => point.total > 0)
  const openClinic = (group: ClinicSeriesGroup) => onOpenDetail({ kind: 'clinic', key: group.key })

  const clinicSeries: StackSeries[] = groups.map((group, index) => ({
    key: group.key,
    label: group.label,
    color: clinicSeriesColor(index, group.key),
    onSelect: group.key === OTHER_CLINICS_KEY ? undefined : () => openClinic(group),
  }))
  const rightsSeries: StackSeries[] = RIGHTS_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    color: RIGHTS_COLORS[group.key],
    onSelect: () => onOpenDetail({ kind: 'rights', key: group.key }),
  }))

  return (
    <div className="space-y-6">
      <DiseaseCards clinicRows={clinicRows} fiscalYear={fiscalYear} asOf={asOf} onSelect={(key) => onOpenDetail({ kind: 'disease', key })} />

      <SectionCard
        title="แนวโน้มนัดรายเดือนแยกตามคลินิก"
        description={`จำนวนนัดของแต่ละคลินิก${comparedWith} · คลิกแท่งเพื่อดูรายละเอียดของคลินิกนั้น`}
        icon={<BarChart3 className="h-5 w-5" />}
      >
        <StackedTrendChart
          points={clinicPoints}
          series={clinicSeries}
          fiscalYear={fiscalYear}
          measure="นัด"
          ariaLabel={`กราฟแท่งซ้อนจำนวนนัดรายเดือนแยกตามคลินิก ปีงบประมาณ ${fiscalYear} เทียบปีงบประมาณ ${fiscalYear - 1}`}
          futureNote="เดือนที่ยังไม่ถึง · ตัวเลขคือนัดล่วงหน้า"
        />
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="สัดส่วนนัดแยกตามคลินิก"
          description={`นัดทั้งปีงบประมาณ ${fiscalYear} · คลิกคลินิกเพื่อดูรายละเอียด`}
          icon={<PieChart className="h-5 w-5" />}
        >
          {shares.length > 0 ? (
            <ClinicShareDonut shares={shares} groups={groups} onSelectGroup={openClinic} />
          ) : (
            <EmptyState title="ยังไม่มีนัดในปีงบนี้" description="เมื่อมีการนัดในคลินิกเบาหวานหรือความดัน สัดส่วนจะแสดงที่นี่" />
          )}
        </SectionCard>

        <SectionCard
          title="แนวโน้มสิทธิการรักษา"
          description="นัดที่มาตามนัดแยกตามสิทธิที่ใช้ในวันนั้น · คลิกแท่งเพื่อดูรายละเอียดของกลุ่มสิทธิ"
          icon={<ShieldCheck className="h-5 w-5" />}
        >
          {hasRights ? (
            <StackedTrendChart
              points={rightsPoints}
              series={rightsSeries}
              fiscalYear={fiscalYear}
              measure="มาตามนัด"
              ariaLabel={`กราฟแท่งซ้อนจำนวนนัดที่มาตามนัดรายเดือนแยกตามกลุ่มสิทธิ ปีงบประมาณ ${fiscalYear}`}
            />
          ) : (
            <EmptyState title="ยังไม่มีผู้ป่วยมาตามนัดในปีงบนี้" description="กลุ่มสิทธิจะแสดงเมื่อมีการมารับบริการตามนัด" />
          )}
        </SectionCard>
      </div>
    </div>
  )
}
