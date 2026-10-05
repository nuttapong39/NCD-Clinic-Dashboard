// =============================================================================
// Monthly NCD appointments: normalization, fiscal-year series, comparisons
// "ดึงครั้งเดียว คำนวณฝั่ง client" (UI-TEMPLATE §1, §9.2–9.4)
// =============================================================================

import { parseCount as count, parseNumber, parseText as text } from '@/utils/dataParser'
import { compareLabel, elapsedMonths, fiscalMonthLabel, fiscalMonths, monthKeyOf } from '@/utils/fiscalYear'
import {
  RIGHTS_GROUPS,
  compareClinics,
  diseaseKeyOfCode,
  diseaseOf,
  rightsGroupKeyOfHipdata,
  rightsGroupOrder,
} from '@/services/ncdCategories'
import type {
  AppointmentCounts,
  AppointmentPoint,
  ClinicInfo,
  ClinicSeriesGroup,
  ClinicShare,
  DetailSubject,
  MonthPoint,
  MonthlyClinicRow,
  MonthlyRightsRow,
  RightsGroupKey,
} from '@/types/ncd'

type RawRow = Record<string, unknown>

/** Chart point with one numeric field per series key (clinic code or rights group). */
export type StackPoint = MonthPoint & { total: number; previousTotal: number } & Record<string, number | string | boolean>

const EMPTY_COUNTS: AppointmentCounts = { appointments: 0, came: 0, missed: 0, notArrivedToday: 0, upcoming: 0 }

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function monthOf(row: RawRow): string | null {
  const year = parseNumber(row['yr'])
  const month = parseNumber(row['mo'])
  if (year === null || month === null || month < 1 || month > 12) return null
  return `${year}-${String(month).padStart(2, '0')}`
}

/** Query 3 rows → typed rows; rows without a month or with an unknown disease are dropped. */
export function normalizeMonthlyClinicRows(rows: readonly RawRow[]): MonthlyClinicRow[] {
  const result: MonthlyClinicRow[] = []
  for (const row of rows) {
    const month = monthOf(row)
    const diseaseKey = diseaseKeyOfCode(text(row['standard_ncd_code']) ?? '')
    const clinicCode = text(row['local_clinic_code'])
    if (!month || !diseaseKey || !clinicCode) continue
    result.push({
      month,
      diseaseKey,
      clinicCode,
      clinicName: text(row['local_clinic_name']) ?? clinicCode,
      appointments: count(row['appt']),
      came: count(row['came']),
      missed: count(row['missed']),
      notArrivedToday: count(row['not_arrived_today']),
      upcoming: count(row['upcoming']),
    })
  }
  return result
}

/** Query 4 rows → one row per month and rights group. */
export function normalizeMonthlyRightsRows(rows: readonly RawRow[]): MonthlyRightsRow[] {
  const totals = new Map<string, number>()
  for (const row of rows) {
    const month = monthOf(row)
    if (!month) continue
    const group = rightsGroupKeyOfHipdata(text(row['hipdata_code']))
    const key = `${month}|${group}`
    totals.set(key, (totals.get(key) ?? 0) + count(row['came']))
  }
  return [...totals.entries()]
    .map(([key, came]) => {
      const [month, rightsGroup] = key.split('|') as [string, RightsGroupKey]
      return { month, rightsGroup, came }
    })
    .sort((a, b) => a.month.localeCompare(b.month) || rightsGroupOrder(a.rightsGroup) - rightsGroupOrder(b.rightsGroup))
}

// ---------------------------------------------------------------------------
// Series
// ---------------------------------------------------------------------------

function monthPoints(fiscalYear: number, today: Date): MonthPoint[] {
  const currentMonth = monthKeyOf(today)
  return fiscalMonths(fiscalYear).map((month) => ({ month, label: fiscalMonthLabel(month), isFuture: month > currentMonth }))
}

function addCounts(target: AppointmentCounts, source: AppointmentCounts): AppointmentCounts {
  return {
    appointments: target.appointments + source.appointments,
    came: target.came + source.came,
    missed: target.missed + source.missed,
    notArrivedToday: target.notArrivedToday + source.notArrivedToday,
    upcoming: target.upcoming + source.upcoming,
  }
}

/** 12 points of appointment counts for a fiscal year; months without data are zero. */
export function buildAppointmentSeries(
  rows: readonly MonthlyClinicRow[],
  fiscalYear: number,
  today: Date,
  include: (row: MonthlyClinicRow) => boolean = () => true,
): AppointmentPoint[] {
  return monthPoints(fiscalYear, today).map((point) => {
    const counts = rows
      .filter((row) => row.month === point.month && include(row))
      .reduce<AppointmentCounts>((sum, row) => addCounts(sum, row), EMPTY_COUNTS)
    return { ...point, ...counts }
  })
}

/** Totals of the first `months` points (year-to-date comparison, §9.2). */
export function summarizeSeries(series: readonly AppointmentCounts[], months: number): AppointmentCounts {
  return series.slice(0, months).reduce<AppointmentCounts>((sum, point) => addCounts(sum, point), EMPTY_COUNTS)
}

/** มาตามนัด ÷ (มาตามนัด + ขาดนัด) × 100, or null when nothing is due yet. */
export function attendanceRate(counts: AppointmentCounts): number | null {
  const due = counts.came + counts.missed
  return due === 0 ? null : (counts.came / due) * 100
}

/** Percentage change, or null when the previous value is zero. */
export function percentChange(current: number, previous: number): number | null {
  return previous === 0 ? null : ((current - previous) / previous) * 100
}

// ---------------------------------------------------------------------------
// Clinics
// ---------------------------------------------------------------------------

/** Every clinic seen in the data once, DM clinics first then by clinic code. */
export function listClinics(rows: readonly MonthlyClinicRow[]): ClinicInfo[] {
  const clinics = new Map<string, ClinicInfo>()
  for (const row of rows) {
    if (!clinics.has(row.clinicCode)) {
      clinics.set(row.clinicCode, { clinicCode: row.clinicCode, clinicName: row.clinicName, diseaseKey: row.diseaseKey })
    }
  }
  return [...clinics.values()].sort(compareClinics)
}

function inFiscalYear(fiscalYear: number): (row: { month: string }) => boolean {
  const months = new Set(fiscalMonths(fiscalYear))
  return (row) => months.has(row.month)
}

/** Most distinct categorical colours a chart may use; further clinics fold into "other". */
export const MAX_CLINIC_SERIES = 6
export const OTHER_CLINICS_KEY = 'other'

/** One chart series per clinic, or the first five plus "คลินิกอื่น ๆ" when there are more than six. */
export function clinicSeriesGroups(clinics: readonly ClinicInfo[], maxSeries = MAX_CLINIC_SERIES): ClinicSeriesGroup[] {
  const own = (clinic: ClinicInfo): ClinicSeriesGroup => ({
    key: clinic.clinicCode,
    label: clinic.clinicName,
    clinicCodes: [clinic.clinicCode],
    diseaseKey: clinic.diseaseKey,
  })
  if (clinics.length <= maxSeries) return clinics.map(own)
  const shown = clinics.slice(0, maxSeries - 1)
  const folded = clinics.slice(maxSeries - 1)
  return [
    ...shown.map(own),
    { key: OTHER_CLINICS_KEY, label: 'คลินิกอื่น ๆ', clinicCodes: folded.map((clinic) => clinic.clinicCode), diseaseKey: null },
  ]
}

function groupKeyOf(groups: readonly ClinicSeriesGroup[]): (row: MonthlyClinicRow) => string {
  const keyByClinic = new Map(groups.flatMap((group) => group.clinicCodes.map((code) => [code, group.key] as const)))
  return (row) => keyByClinic.get(row.clinicCode) ?? OTHER_CLINICS_KEY
}

/** Each series' share of the fiscal year's appointments (series with none are left out). */
export function clinicShare(
  rows: readonly MonthlyClinicRow[],
  fiscalYear: number,
  groups: readonly ClinicSeriesGroup[],
): ClinicShare[] {
  const yearRows = rows.filter(inFiscalYear(fiscalYear))
  const total = yearRows.reduce((sum, row) => sum + row.appointments, 0)
  const keyOf = groupKeyOf(groups)
  return groups
    .map((group) => ({
      ...group,
      appointments: yearRows.filter((row) => keyOf(row) === group.key).reduce((sum, row) => sum + row.appointments, 0),
    }))
    .filter((group) => group.appointments > 0)
    .map((group) => ({ ...group, percentage: (group.appointments / total) * 100 }))
}

function previousMonth(month: string): string {
  const [year, monthNumber] = month.split('-')
  return `${Number(year) - 1}-${monthNumber}`
}

function stackSeries<Row extends { month: string }>(
  rows: readonly Row[],
  fiscalYear: number,
  today: Date,
  keys: readonly string[],
  keyOf: (row: Row) => string,
  valueOf: (row: Row) => number,
): StackPoint[] {
  return monthPoints(fiscalYear, today).map((point) => {
    const monthRows = rows.filter((row) => row.month === point.month)
    const values = Object.fromEntries(
      keys.map((key) => [key, monthRows.filter((row) => keyOf(row) === key).reduce((sum, row) => sum + valueOf(row), 0)]),
    )
    const lastYear = previousMonth(point.month)
    return {
      ...point,
      ...values,
      total: monthRows.reduce((sum, row) => sum + valueOf(row), 0),
      previousTotal: rows.filter((row) => row.month === lastYear).reduce((sum, row) => sum + valueOf(row), 0),
    }
  })
}

/** Stacked appointments per clinic series with last year's monthly total. */
export function buildClinicStackSeries(
  rows: readonly MonthlyClinicRow[],
  fiscalYear: number,
  today: Date,
  groups: readonly ClinicSeriesGroup[],
): StackPoint[] {
  return stackSeries(rows, fiscalYear, today, groups.map((group) => group.key), groupKeyOf(groups), (row) => row.appointments)
}

/** Stacked attended appointments per rights group with last year's monthly total. */
export function buildRightsSeries(rows: readonly MonthlyRightsRow[], fiscalYear: number, today: Date): StackPoint[] {
  return stackSeries(rows, fiscalYear, today, RIGHTS_GROUPS.map((group) => group.key), (row) => row.rightsGroup, (row) => row.came)
}

// ---------------------------------------------------------------------------
// Detail modal and CSV
// ---------------------------------------------------------------------------

export interface DetailSeries {
  current: AppointmentPoint[]
  previous: AppointmentPoint[]
}

function rightsAsAppointments(rows: readonly MonthlyRightsRow[], group: RightsGroupKey): MonthlyClinicRow[] {
  return rows
    .filter((row) => row.rightsGroup === group)
    .map((row) => ({ ...EMPTY_COUNTS, month: row.month, diseaseKey: 'dm', clinicCode: group, clinicName: group, came: row.came }))
}

/** Current and previous fiscal-year series for whatever the detail modal is about. */
export function detailSeries(
  subject: DetailSubject,
  clinicRows: readonly MonthlyClinicRow[],
  rightsRows: readonly MonthlyRightsRow[],
  fiscalYear: number,
  today: Date,
): DetailSeries {
  const rows = subject.kind === 'rights' ? rightsAsAppointments(rightsRows, subject.key) : clinicRows
  const include = (row: MonthlyClinicRow) =>
    subject.kind === 'disease' ? row.diseaseKey === subject.key : subject.kind === 'clinic' ? row.clinicCode === subject.key : true
  return {
    current: buildAppointmentSeries(rows, fiscalYear, today, include),
    previous: buildAppointmentSeries(rows, fiscalYear - 1, today, include),
  }
}

export const MONTHLY_CSV_COLUMNS = [
  'month',
  'disease',
  'local_clinic_code',
  'local_clinic_name',
  'appointments',
  'came',
  'missed',
  'not_arrived_today',
  'upcoming',
  'attendance_rate',
] as const

export type MonthlyCsvRow = Record<(typeof MONTHLY_CSV_COLUMNS)[number], string | number | null>

/** Fiscal-year rows for CSV export, ordered by month then clinic code. */
export function monthlyCsvRows(rows: readonly MonthlyClinicRow[], fiscalYear: number): MonthlyCsvRow[] {
  return rows
    .filter(inFiscalYear(fiscalYear))
    .slice()
    .sort((a, b) => a.month.localeCompare(b.month) || a.clinicCode.localeCompare(b.clinicCode))
    .map((row) => {
      const rate = attendanceRate(row)
      return {
        month: row.month,
        disease: diseaseOf(row.diseaseKey).shortLabel,
        local_clinic_code: row.clinicCode,
        local_clinic_name: row.clinicName,
        appointments: row.appointments,
        came: row.came,
        missed: row.missed,
        not_arrived_today: row.notArrivedToday,
        upcoming: row.upcoming,
        attendance_rate: rate === null ? null : Math.round(rate * 10) / 10,
      }
    })
}

export interface SubjectYearSummary {
  current: AppointmentCounts
  previous: AppointmentCounts
  cameChange: number | null
  attendanceRate: number | null
  previousAttendanceRate: number | null
  elapsed: number
  compareLabel: string
}

/** Year-to-date totals of a subject against the same months of the previous fiscal year. */
export function subjectYearSummary(
  subject: DetailSubject,
  clinicRows: readonly MonthlyClinicRow[],
  rightsRows: readonly MonthlyRightsRow[],
  fiscalYear: number,
  today: Date,
): SubjectYearSummary {
  const series = detailSeries(subject, clinicRows, rightsRows, fiscalYear, today)
  const elapsed = elapsedMonths(fiscalYear, today)
  const current = summarizeSeries(series.current, elapsed)
  const previous = summarizeSeries(series.previous, elapsed)
  return {
    current,
    previous,
    cameChange: percentChange(current.came, previous.came),
    attendanceRate: attendanceRate(current),
    previousAttendanceRate: attendanceRate(previous),
    elapsed,
    compareLabel: compareLabel(fiscalYear, elapsed),
  }
}
