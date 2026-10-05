import { diseaseOf } from '@/services/ncdCategories'
import { KpiCard } from '@/components/ui/KpiCard'
import { DISEASE_VISUALS, TOTAL_VISUAL } from '@/components/ncd/visuals'
import { formatNumber, formatPercent } from '@/utils/formatters'
import type { TodaySummary } from '@/types/ncd'

interface TodaySummaryCardsProps {
  summary: TodaySummary
  selectedClinic: string | null
  onSelectClinic: (clinicCode: string | null) => void
}

function arrivedShare(came: number, appointments: number): string {
  return appointments === 0 ? 'ยังไม่มีนัดวันนี้' : `มาแล้ว ${formatPercent((came / appointments) * 100)} ของนัด`
}

/** Total card plus one card per clinic; clicking a clinic filters the not-arrived list. */
export function TodaySummaryCards({ summary, selectedClinic, onSelectClinic }: TodaySummaryCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label="นัดวันนี้ทั้งหมด"
        description={`${summary.clinics.length} คลินิก`}
        icon={TOTAL_VISUAL.icon}
        tileClassName={TOTAL_VISUAL.tile}
        glowColor={TOTAL_VISUAL.color}
        featured
        pressed={selectedClinic === null}
        actionLabel="แสดงรายชื่อทุกคลินิก"
        onClick={() => onSelectClinic(null)}
        metrics={[
          { label: 'นัด (ครั้ง)', value: formatNumber(summary.appointments) },
          { label: 'ยังไม่มา', value: formatNumber(summary.notArrived) },
        ]}
        footnote={arrivedShare(summary.came, summary.appointments)}
      />
      {summary.clinics.map((clinic) => {
        const visual = DISEASE_VISUALS[clinic.diseaseKey]
        return (
          <KpiCard
            key={clinic.clinicCode}
            label={clinic.clinicName}
            description={`${diseaseOf(clinic.diseaseKey).label} · รหัส ${clinic.clinicCode}`}
            icon={visual.icon}
            tileClassName={visual.tile}
            glowColor={visual.color}
            pressed={selectedClinic === clinic.clinicCode}
            actionLabel="กรองรายชื่อผู้ป่วยที่ยังไม่มาของคลินิกนี้"
            onClick={() => onSelectClinic(selectedClinic === clinic.clinicCode ? null : clinic.clinicCode)}
            metrics={[
              { label: 'นัด (ครั้ง)', value: formatNumber(clinic.appointments) },
              { label: 'ยังไม่มา', value: formatNumber(clinic.notArrived) },
            ]}
            footnote={arrivedShare(clinic.came, clinic.appointments)}
          />
        )
      })}
    </div>
  )
}
