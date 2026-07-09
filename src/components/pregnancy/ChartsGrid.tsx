// src/components/pregnancy/ChartsGrid.tsx
import type {
  DeliveryTrendData,
  DeliveryTypeData,
  GaDistributionData,
  BirthWeightData,
  ApgarScoreData,
  AncComplianceData,
} from '@/types/pregnancy'
import { DeliveryTrendChart } from './DeliveryTrendChart'
import { DeliveryTypeChart } from './DeliveryTypeChart'
import { GaDistributionChart } from './GaDistributionChart'
import { BirthWeightChart } from './BirthWeightChart'
import { ApgarScoreChart } from './ApgarScoreChart'
import { AncComplianceChart } from './AncComplianceChart'
import { Tooltip } from '@/components/ui/Tooltip'
import { SectionHeader } from '@/components/ui/SectionHeader'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChartsGridProps {
  deliveryTrend: DeliveryTrendData[]
  deliveryTypes: DeliveryTypeData[]
  gaDistribution: GaDistributionData[]
  birthWeight: BirthWeightData[]
  apgarScores: ApgarScoreData[]
  ancCompliance: AncComplianceData[]
  loading?: boolean
}

// ---------------------------------------------------------------------------
// Chart Card Wrapper
// ---------------------------------------------------------------------------

function ChartCard({ tooltip, children }: { tooltip: string; children: React.ReactNode }) {
  return (
    <Tooltip content={tooltip} position="bottom">
      <div className="rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow">
        {children}
      </div>
    </Tooltip>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChartsGrid({
  deliveryTrend,
  deliveryTypes,
  gaDistribution,
  birthWeight,
  apgarScores,
  ancCompliance,
  loading,
}: ChartsGridProps) {
  return (
    <div className="space-y-8">
      {/* Antenatal Charts */}
      <div>
        <SectionHeader
          title="แผนภูมิฝากครรภ์"
          subtitle="Antenatal Charts"
          accent="from-blue-500 to-cyan-500"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard tooltip="แสดงการกระจายตามอายุครรภ์ (GA) เป็นช่วง: <12 สัปดาห์, 12-27 สัปดาห์, 28-36 สัปดาห์, และ 37 สัปดาห์ขึ้นไป คำนวณจาก lmp\n\nตาราง: person_anc">
            <GaDistributionChart data={gaDistribution} loading={loading} />
          </ChartCard>
          <ChartCard tooltip="แสดงจำนวนครั้งที่มาฝากครรภ์ของหญิงตั้งครรภ์แต่ละราย นับจากตาราง person_anc_preg_care ที่เชื่อมกับ person_anc\n\nตาราง: person_anc_preg_care">
            <AncComplianceChart data={ancCompliance} loading={loading} />
          </ChartCard>
        </div>
      </div>

      {/* Labor & Delivery Charts */}
      <div>
        <SectionHeader
          title="แผนภูมิการคลอด"
          subtitle="Labor & Delivery Charts"
          accent="from-emerald-500 to-teal-500"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard tooltip="แสดงจำนวนการคลอดในแต่ละเดือนย้อนหลัง 3 เดือน จากตาราง person_anc โดยจัดกลุ่มตามเดือนของ labor_date\n\nตาราง: person_anc">
            <DeliveryTrendChart data={deliveryTrend} loading={loading} />
          </ChartCard>
          <ChartCard tooltip="แสดงสัดส่วนประเภทการคลอด (Normal, C-Section, Vacuum, Forceps ฯลฯ) จากตาราง person_labour เชื่อมกับ person_labour_type\n\nตาราง: person_labour, person_labour_type">
            <DeliveryTypeChart data={deliveryTypes} loading={loading} />
          </ChartCard>
        </div>
      </div>

      {/* Neonatal Charts */}
      <div>
        <SectionHeader
          title="แผนภูมิทารกแรกเกิด"
          subtitle="Neonatal Outcome Charts"
          accent="from-rose-500 to-pink-500"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ChartCard tooltip="แสดงการกระจายน้ำหนักทารกแรกคลอด: ต่ำกว่า 2500g, 2500-4000g, และมากกว่า 4000g จากตาราง person_labour (birth_weight)\n\nตาราง: person_labour">
            <BirthWeightChart data={birthWeight} loading={loading} />
          </ChartCard>
          <ChartCard tooltip="แสดงการกระจายคะแนน Apgar ที่ 1 นาทีและ 5 นาที หลังคลอด จากตาราง person_labour (apgar_score_1, apgar_score_5)\n\nตาราง: person_labour">
            <ApgarScoreChart data={apgarScores} loading={loading} />
          </ChartCard>
        </div>
      </div>
    </div>
  )
}
