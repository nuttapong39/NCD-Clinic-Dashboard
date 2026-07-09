// src/components/pregnancy/KpiCardsRow.tsx
import type { PregnancyKpis } from '@/types/pregnancy'
import { KpiCard } from './KpiCard'
import type { KpiCardProps } from './KpiCard'
import { SectionHeader } from '@/components/ui/SectionHeader'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KpiCardsRowProps {
  kpis: PregnancyKpis | null
  loading?: boolean
  onKpiClick?: (kpiKey: keyof PregnancyKpis) => void
}

type KpiConfig = {
  key: keyof PregnancyKpis
  title: string
  icon: string
  color: KpiCardProps['color']
  format: 'number' | 'percentage'
  dataSource: string
  description: string
}

// ---------------------------------------------------------------------------
// Section Definitions — Clinical flow order
// ---------------------------------------------------------------------------

interface KpiSection {
  id: string
  title: string
  subtitle: string
  accent: string
  kpis: KpiConfig[]
}

const KPI_SECTIONS: KpiSection[] = [
  {
    id: 'antenatal',
    title: 'ฝากครรภ์',
    subtitle: 'Antenatal Care',
    accent: 'from-blue-500 to-cyan-500',
    kpis: [
      { key: 'activePregnancies', title: 'ตั้งครรภ์ปัจจุบัน', icon: 'Baby', color: 'rose', format: 'number', dataSource: 'person_anc', description: 'นับจำนวนหญิงตั้งครรภ์ที่ยังไม่คลอดและยังไม่จำหน่าย จากตาราง person_anc โดย labor_date IS NULL และ discharge != \'Y\'' },
      { key: 'newAncThisMonth', title: 'ฝากครรภ์ใหม่เดือนนี้', icon: 'CalendarPlus', color: 'blue', format: 'number', dataSource: 'person_anc', description: 'นับจำนวนการลงทะเบียนฝากครรภ์ใหม่ในเดือนปัจจุบัน จากตาราง person_anc โดย anc_register_date >= วันที่ 1 ของเดือนปัจจุบัน' },
      { key: 'firstAncBefore12Weeks', title: 'ฝากครรภ์ก่อน 12 สัปดาห์', icon: 'CalendarCheck', color: 'green', format: 'percentage', dataSource: 'person_anc', description: 'ตัวชี้วัดกระทรวง 2568: ร้อยละหญิงตั้งครรภ์มาฝากครรภ์ครั้งแรกก่อนอายุครรภ์ 12 สัปดาห์ คำนวณจาก anc_register_date - lmp < 84 วัน' },
      { key: 'highRiskCount', title: 'เสี่ยงสูง', icon: 'AlertTriangle', color: 'red', format: 'number', dataSource: 'person_anc', description: 'นับจำนวนหญิงตั้งครรภ์ที่มีความเสี่ยง (has_risk = \'Y\') และยังไม่คลอด จากตาราง person_anc' },
      { key: 'anc5PlusCoverage', title: 'ANC 5+ ครั้ง', icon: 'CheckCircle', color: 'indigo', format: 'percentage', dataSource: 'person_anc_preg_care', description: 'คำนวณเปอร์เซ็นต์ของหญิงตั้งครรภ์ที่มาฝากครรภ์ครบ 5 ครั้งขึ้นไป โดยนับจากตาราง person_anc_preg_care ที่เชื่อมกับ person_anc' },
      { key: 'anc8QualityCompletion', title: 'ANC ครบ 8 ครั้ง คุณภาพ', icon: 'ClipboardCheck', color: 'cyan', format: 'percentage', dataSource: 'person_anc_preg_care, person_labour', description: 'ตัวชี้วัดกระทรวง 2568: ร้อยละฝากครรภ์ครบ 8 ครั้ง ร่วมกับบุตรน้ำหนัก ≥2,500g เกณฑ์ ≥50%' },
      { key: 'ttVaccineCoverage', title: 'ครอบคลุม TT', icon: 'Shield', color: 'teal', format: 'percentage', dataSource: 'person_anc', description: 'คำนวณเปอร์เซ็นต์ของหญิงตั้งครรภ์ที่ได้รับวัคซีน TT ครบตามเกณฑ์ (vaccine_tt_complete = \'Y\') ใน 3 เดือนที่ผ่านมา หรือยังไม่คลอด' },
    ],
  },
  {
    id: 'labor',
    title: 'การคลอด',
    subtitle: 'Labor & Delivery',
    accent: 'from-emerald-500 to-teal-500',
    kpis: [
      { key: 'dueWithin30Days', title: 'รอคลอดใกล้เคียง', icon: 'Clock', color: 'amber', format: 'number', dataSource: 'person_anc', description: 'นับจำนวนหญิงตั้งครรภ์ที่ยังไม่คลอดและมีกำหนดคลอด (edc) ภายใน 30 วันจากวันนี้ จากตาราง person_anc' },
      { key: 'deliveriesThisMonth', title: 'คลอดเดือนนี้', icon: 'Heart', color: 'emerald', format: 'number', dataSource: 'person_anc', description: 'นับจำนวนการคลอดในเดือนปัจจุบัน จากตาราง person_anc โดย labor_date >= วันที่ 1 ของเดือนปัจจุบัน' },
      { key: 'cSectionRate', title: 'อัตรา C-Section', icon: 'Activity', color: 'purple', format: 'percentage', dataSource: 'person_labour, person_labour_type', description: 'คำนวณจากจำนวนการคลอดผ่าตัด C-Section หารด้วยจำนวนการคลอดทั้งหมดใน 3 เดือนที่ผ่านมา โดยเชื่อมตาราง person_labour กับ person_labour_type' },
      { key: 'pretermBirthRate', title: 'คลอดก่อนกำหนด', icon: 'Timer', color: 'pink', format: 'percentage', dataSource: 'person_labour', description: 'อัตราคลอดก่อนกำหนด (GA <37 สัปดาห์) ใน 3 เดือนที่ผ่านมา (WHO perinatal indicator)' },
    ],
  },
  {
    id: 'neonatal',
    title: 'ทารกแรกเกิด',
    subtitle: 'Neonatal Outcomes',
    accent: 'from-rose-500 to-pink-500',
    kpis: [
      { key: 'lowBirthWeightRate', title: 'น้ำหนักน้อย (<2500g)', icon: 'Scale', color: 'orange', format: 'percentage', dataSource: 'person_labour', description: 'อัตราทารกน้ำหนักแรกคลอดต่ำกว่า 2,500 กรัม ใน 3 เดือนที่ผ่านมา (WHO core indicator)' },
      { key: 'lowApgarRate', title: 'Apgar <7 ที่ 5 นาที', icon: 'HeartPulse', color: 'yellow', format: 'percentage', dataSource: 'person_labour', description: 'อัตราทารกแรกเกิดที่มี Apgar score ต่ำกว่า 7 ที่ 5 นาที บ่งชี้ภาวะขาดออกซิเจน (neonatal quality indicator)' },
      { key: 'stillbirthRate', title: 'อัตราทารกตายคลอด', icon: 'Skull', color: 'slate', format: 'percentage', dataSource: 'person_labour', description: 'อัตราทารกตายคลอด (stillbirth) ใน 6 เดือนที่ผ่านมา (WHO core perinatal indicator)' },
    ],
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KpiCardsRow({ kpis, loading, onKpiClick }: KpiCardsRowProps) {
  return (
    <div className="space-y-6">
      {KPI_SECTIONS.map((section) => (
        <div key={section.id}>
          <SectionHeader
            title={section.title}
            subtitle={section.subtitle}
            accent={section.accent}
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {section.kpis.map((config) => (
              <KpiCard
                key={config.key}
                title={config.title}
                value={kpis?.[config.key] ?? null}
                icon={config.icon}
                color={config.color}
                format={config.format}
                loading={loading}
                dataSource={config.dataSource}
                description={config.description}
                tooltipPosition="bottom"
                onClick={onKpiClick ? () => onKpiClick(config.key) : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
