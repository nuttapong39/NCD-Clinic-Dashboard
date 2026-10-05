// =============================================================================
// Detail modal for a disease, clinic or rights group — UI-TEMPLATE §7.10
// =============================================================================

import { useId, useMemo, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Info, ShieldCheck } from 'lucide-react'
import { Area, CartesianGrid, ComposedChart, Line, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { TooltipContentProps } from 'recharts'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { ChangeBadge } from '@/components/ui/ChangeBadge'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { ChartLegend, ChartTooltipCard } from '@/components/ncd/chartParts'
import { FUTURE_AREA_FILL, GRID_PROPS, PREVIOUS_LINE_PROPS, X_AXIS_PROPS, Y_AXIS_PROPS, futureRange } from '@/components/ncd/chartConfig'
import { DISEASE_VISUALS, PREVIOUS_YEAR_COLOR, RIGHTS_COLORS, clinicSeriesColor } from '@/components/ncd/visuals'
import { MonthlyDetailTable } from '@/components/ncd/MonthlyDetailTable'
import { diseaseOf, rightsGroupOf } from '@/services/ncdCategories'
import { detailSeries, subjectYearSummary } from '@/services/ncdMonthlyProcessing'
import { fiscalYearRange } from '@/utils/fiscalYear'
import { NO_VALUE, formatNumber, formatPercent, formatThaiDate } from '@/utils/formatters'
import type { ClinicSeriesGroup, DetailSubject, MonthlyClinicRow, MonthlyRightsRow } from '@/types/ncd'

type Metric = 'came' | 'missed' | 'appointments'

const METRIC_OPTIONS: readonly { value: Metric; label: string }[] = [
  { value: 'came', label: 'มาตามนัด' },
  { value: 'missed', label: 'ขาดนัด' },
  { value: 'appointments', label: 'นัดทั้งหมด' },
]

const ATTENDANCE_RULE = 'มาตามนัด = มีการมารับบริการที่โรงพยาบาลตรงวันนัด · อัตรามาตามนัด = มาตามนัด ÷ (มาตามนัด + ขาดนัด) · ไม่นับนัดที่ยกเลิก'

interface SubjectDescription {
  title: string
  description: string
  method: string
  color: string
  icon: LucideIcon
  tile: string
}

function describeSubject(subject: DetailSubject, groups: readonly ClinicSeriesGroup[]): SubjectDescription {
  if (subject.kind === 'disease') {
    const disease = diseaseOf(subject.key)
    const visual = DISEASE_VISUALS[subject.key]
    return {
      title: `คลินิก${disease.label} (${disease.shortLabel})`,
      description: 'นัดและการมาตามนัดรายเดือนของทุกคลินิกในโรคนี้',
      method: `${disease.description} · ${ATTENDANCE_RULE} · ถ้า รพ. ใช้คลินิก NCD รวมที่ผูกกับประเภทคลินิกเดียว นัดทั้งหมดจะนับอยู่ในโรคนั้น`,
      color: visual.color,
      icon: visual.icon,
      tile: visual.tile,
    }
  }
  if (subject.kind === 'clinic') {
    const index = groups.findIndex((group) => group.key === subject.key)
    const group = groups[index]
    const visual = DISEASE_VISUALS[group?.diseaseKey ?? 'dm']
    return {
      title: group?.label ?? subject.key,
      description: `คลินิกรหัส ${subject.key}${group?.diseaseKey ? ` · ${diseaseOf(group.diseaseKey).label}` : ''}`,
      method: ATTENDANCE_RULE,
      color: clinicSeriesColor(Math.max(index, 0), subject.key),
      icon: visual.icon,
      tile: visual.tile,
    }
  }
  const rights = rightsGroupOf(subject.key)
  return {
    title: `สิทธิ${rights.label}`,
    description: 'นัดที่มาตามนัดและใช้สิทธินี้ในวันนั้น',
    method: `นับเฉพาะนัดที่มาตามนัด โดยดูสิทธิของการมารับบริการวันนั้น และจัดกลุ่มจากรหัส hipdata ของสิทธิ${rights.hipdataCodes.length ? ` (${rights.hipdataCodes.join(', ')})` : ' ที่ไม่อยู่ใน UC/ข้าราชการ/ประกันสังคม/อปท.'}`,
    color: RIGHTS_COLORS[subject.key],
    icon: ShieldCheck,
    tile: 'bg-accent text-primary',
  }
}

interface TrendDetailModalProps {
  subject: DetailSubject | null
  onClose: () => void
  clinicRows: readonly MonthlyClinicRow[]
  rightsRows: readonly MonthlyRightsRow[]
  groups: readonly ClinicSeriesGroup[]
  fiscalYear: number
  asOf: Date
}

export function TrendDetailModal({ subject, onClose, ...rest }: TrendDetailModalProps) {
  return (
    <Dialog open={subject !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] grid-cols-[minmax(0,1fr)] gap-6 overflow-y-auto rounded-2xl border-border/70 p-6 sm:max-w-3xl sm:p-7">
        {subject && <DetailBody subject={subject} onClose={onClose} {...rest} />}
      </DialogContent>
    </Dialog>
  )
}

function DetailBody({ subject, onClose, clinicRows, rightsRows, groups, fiscalYear, asOf }: TrendDetailModalProps & { subject: DetailSubject }) {
  const gradientId = useId()
  const isRights = subject.kind === 'rights'
  const [metric, setMetric] = useState<Metric>('came')
  const shownMetric: Metric = isRights ? 'came' : metric

  const info = describeSubject(subject, groups)
  const series = useMemo(() => detailSeries(subject, clinicRows, rightsRows, fiscalYear, asOf), [subject, clinicRows, rightsRows, fiscalYear, asOf])
  const summary = useMemo(() => subjectYearSummary(subject, clinicRows, rightsRows, fiscalYear, asOf), [subject, clinicRows, rightsRows, fiscalYear, asOf])
  const hasCompletedMonths = summary.completedMonths > 0
  const range = fiscalYearRange(fiscalYear)
  const points = series.current.map((point, index) => ({
    ...point,
    value: point.isFuture && shownMetric !== 'appointments' ? null : point[shownMetric],
    previous: series.previous[index][shownMetric],
  }))
  const future = futureRange(points)
  const metricLabel = METRIC_OPTIONS.find((option) => option.value === shownMetric)?.label ?? ''

  const renderTooltip = ({ active, label }: TooltipContentProps) => {
    const point = points.find((candidate) => candidate.label === label)
    if (!active || !point) return null
    return (
      <ChartTooltipCard
        title={`${metricLabel} ${point.label}`}
        rows={[
          { label: `ปีงบ ${fiscalYear}`, value: point.value, color: info.color, emphasis: true },
          { label: `ปีงบ ${fiscalYear - 1}`, value: point.previous, color: PREVIOUS_YEAR_COLOR, dashed: true },
        ]}
      />
    )
  }

  const Icon = info.icon
  return (
    <>
      <header className="flex items-start gap-3 pr-8">
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${info.tile}`} aria-hidden="true">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <DialogTitle>{info.title}</DialogTitle>
          <DialogDescription>
            {info.description} · ปีงบประมาณ {fiscalYear} ({formatThaiDate(range.start)} – {formatThaiDate(range.end)})
          </DialogDescription>
        </div>
      </header>

      <p className="flex gap-2 rounded-xl bg-accent/60 p-3 text-xs leading-relaxed text-accent-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{info.method}</span>
      </p>

      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="มาตามนัด ถึงวันนี้"
          value={formatNumber(summary.toDate.came)}
          note={hasCompletedMonths ? `เดือนที่ครบ ${formatNumber(summary.completed.came)}` : 'ยังไม่มีเดือนที่ครบ'}
        />
        <Stat
          label="ปีงบก่อน เดือนเดียวกัน"
          value={hasCompletedMonths ? formatNumber(summary.previousCompleted.came) : NO_VALUE}
          note={summary.compareLabel}
        />
        <Stat
          label="เปลี่ยนแปลง (เดือนที่ครบ)"
          value={<ChangeBadge change={summary.cameChange} emptyLabel={hasCompletedMonths ? undefined : 'รอให้ครบเดือนแรก'} />}
        />
        {isRights ? (
          <Stat label="ขาดนัด / นัดล่วงหน้า" value="—" note="สิทธิมีเฉพาะนัดที่มาตามนัด" />
        ) : (
          <Stat
            label="อัตรามาตามนัด"
            value={formatPercent(summary.attendanceRate)}
            note={`ปีก่อน ${formatPercent(summary.previousAttendanceRate)}`}
          />
        )}
      </dl>

      <section aria-label="แนวโน้มรายเดือน">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold tracking-tight">แนวโน้มรายเดือน · {metricLabel}</h3>
          {!isRights && <SegmentedToggle label="เลือกตัวชี้วัด" value={metric} options={METRIC_OPTIONS} onChange={setMetric} />}
        </div>
        <div className="h-52" role="img" aria-label={`กราฟพื้นที่${metricLabel}รายเดือน ปีงบประมาณ ${fiscalYear} เทียบ ${fiscalYear - 1}`}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={info.color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={info.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid {...GRID_PROPS} />
              <XAxis {...X_AXIS_PROPS} />
              <YAxis {...Y_AXIS_PROPS} />
              {future && <ReferenceArea x1={future.x1} x2={future.x2} fill={FUTURE_AREA_FILL} fillOpacity={0.6} ifOverflow="extendDomain" />}
              <Tooltip content={renderTooltip} cursor={{ stroke: 'hsl(var(--border))' }} />
              <Area type="monotone" dataKey="value" stroke={info.color} strokeWidth={2} fill={`url(#${gradientId})`} connectNulls={false} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} />
              <Line dataKey="previous" stroke={PREVIOUS_YEAR_COLOR} {...PREVIOUS_LINE_PROPS} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <ChartLegend
          items={[
            { key: 'current', label: `ปีงบ ${fiscalYear}`, color: info.color },
            { key: 'previous', label: `ปีงบ ${fiscalYear - 1}`, color: PREVIOUS_YEAR_COLOR, kind: 'dashed' },
          ]}
        />
      </section>

      <MonthlyDetailTable
        current={series.current}
        previous={series.previous}
        summary={summary}
        attendanceOnly={isRights}
        fiscalYear={fiscalYear}
      />

      <footer className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          ปิด
        </button>
      </footer>
    </>
  )
}

function Stat({ label, value, note }: { label: string; value: ReactNode; note?: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-xl font-semibold tabular-nums tracking-tight">{value}</dd>
      {note && <dd className="text-[11px] text-muted-foreground">{note}</dd>}
    </div>
  )
}
