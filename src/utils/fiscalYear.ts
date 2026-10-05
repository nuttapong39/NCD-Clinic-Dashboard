// =============================================================================
// Thai fiscal year (ปีงบประมาณ) helpers — 1 Oct to 30 Sep, named by Buddhist-era year
// =============================================================================

export const BE_OFFSET = 543

const FISCAL_START_MONTH_INDEX = 9 // October
const MONTHS_PER_YEAR = 12

const THAI_SHORT_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
] as const

export interface DateRange {
  start: string
  end: string
}

function gregorianEndYear(fiscalYear: number): number {
  return fiscalYear - BE_OFFSET
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/** Fiscal year (พ.ศ.) that contains the given date. */
export function fiscalYearOf(date: Date): number {
  const year = date.getMonth() >= FISCAL_START_MONTH_INDEX ? date.getFullYear() + 1 : date.getFullYear()
  return year + BE_OFFSET
}

/** ISO date range of a fiscal year, e.g. 2569 → 2025-10-01 .. 2026-09-30. */
export function fiscalYearRange(fiscalYear: number): DateRange {
  const endYear = gregorianEndYear(fiscalYear)
  return { start: `${endYear - 1}-10-01`, end: `${endYear}-09-30` }
}

/** Range covering the previous fiscal year and the selected one, for year-on-year comparison. */
export function comparisonRange(fiscalYear: number): DateRange {
  return { start: fiscalYearRange(fiscalYear - 1).start, end: fiscalYearRange(fiscalYear).end }
}

/** The 12 months of a fiscal year as `YYYY-MM`, October first. */
export function fiscalMonths(fiscalYear: number): string[] {
  const startYear = gregorianEndYear(fiscalYear) - 1
  return Array.from({ length: MONTHS_PER_YEAR }, (_, offset) => {
    const monthIndex = (FISCAL_START_MONTH_INDEX + offset) % MONTHS_PER_YEAR
    const year = startYear + Math.floor((FISCAL_START_MONTH_INDEX + offset) / MONTHS_PER_YEAR)
    return `${year}-${pad2(monthIndex + 1)}`
  })
}

/** `2025-10` → `ต.ค. 68` */
export function fiscalMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  const shortYear = String((year + BE_OFFSET) % 100).padStart(2, '0')
  return `${THAI_SHORT_MONTHS[monthNumber - 1]} ${shortYear}`
}

/** Selectable fiscal years, newest first. */
export function fiscalYearOptions(currentFiscalYear: number, count = 5): number[] {
  return Array.from({ length: count }, (_, index) => currentFiscalYear - index)
}

/** Months of the fiscal year that have started by `today` (0–12, current month included). */
export function elapsedMonths(fiscalYear: number, today: Date): number {
  const startYear = gregorianEndYear(fiscalYear) - 1
  const monthsSinceStart =
    (today.getFullYear() - startYear) * MONTHS_PER_YEAR + today.getMonth() - FISCAL_START_MONTH_INDEX + 1
  return Math.min(MONTHS_PER_YEAR, Math.max(0, monthsSinceStart))
}

/** `YYYY-MM` of a date in local time. */
export function monthKeyOf(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`
}
