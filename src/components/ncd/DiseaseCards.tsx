import { useMemo } from 'react'
import { DISEASES } from '@/services/ncdCategories'
import { subjectYearSummary } from '@/services/ncdMonthlyProcessing'
import { KpiCard } from '@/components/ui/KpiCard'
import { ChangeBadge } from '@/components/ui/ChangeBadge'
import { DISEASE_VISUALS } from '@/components/ncd/visuals'
import { formatNumber, formatPercent } from '@/utils/formatters'
import type { DiseaseKey, MonthlyClinicRow } from '@/types/ncd'

interface DiseaseCardsProps {
  clinicRows: readonly MonthlyClinicRow[]
  fiscalYear: number
  asOf: Date
  onSelect: (disease: DiseaseKey) => void
}

/** DM and HT year-to-date cards; each opens the monthly detail modal. */
export function DiseaseCards({ clinicRows, fiscalYear, asOf, onSelect }: DiseaseCardsProps) {
  const summaries = useMemo(
    () =>
      DISEASES.map((disease) => ({
        disease,
        summary: subjectYearSummary({ kind: 'disease', key: disease.key }, clinicRows, [], fiscalYear, asOf),
      })),
    [clinicRows, fiscalYear, asOf],
  )

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {summaries.map(({ disease, summary }) => {
        const visual = DISEASE_VISUALS[disease.key]
        return (
          <KpiCard
            key={disease.key}
            label={`${disease.label} (${disease.shortLabel})`}
            description={`นัด ${formatNumber(summary.toDate.appointments)} ครั้ง · ขาดนัด ${formatNumber(summary.toDate.missed)} ครั้ง`}
            icon={visual.icon}
            tileClassName={visual.tile}
            glowColor={visual.color}
            actionLabel="ดูแนวโน้มและรายละเอียดรายเดือน"
            onClick={() => onSelect(disease.key)}
            metrics={[
              {
                label: 'มาตามนัด (ครั้ง)',
                value: formatNumber(summary.toDate.came),
                badge: <ChangeBadge change={summary.cameChange} emptyLabel={summary.completedMonths === 0 ? 'รอให้ครบเดือนแรก' : undefined} />,
              },
              {
                label: 'อัตรามาตามนัด',
                value: formatPercent(summary.attendanceRate),
                badge: <span className="text-xs text-muted-foreground">ปีก่อน {formatPercent(summary.previousAttendanceRate)}</span>,
              },
            ]}
            footnote={summary.compareLabel}
          />
        )
      })}
    </div>
  )
}
