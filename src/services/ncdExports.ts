// =============================================================================
// CSV exports: file name and content for the monthly summary and the
// not-yet-arrived patient list (UI-TEMPLATE §9.6)
// =============================================================================

import { MONTHLY_CSV_COLUMNS, monthlyCsvRows } from '@/services/ncdMonthlyProcessing'
import { NOT_ARRIVED_CSV_COLUMNS, notArrivedCsvRows } from '@/services/ncdTodayProcessing'
import { toCsv } from '@/utils/csv'
import { dateKeyOf } from '@/utils/fiscalYear'
import type { MonthlyClinicRow, NotArrivedPatient } from '@/types/ncd'

export interface CsvFile {
  filename: string
  csv: string
}

export function monthlyExport(rows: readonly MonthlyClinicRow[], fiscalYear: number): CsvFile {
  return {
    filename: `ncd-clinic-fy${fiscalYear}.csv`,
    csv: toCsv(MONTHLY_CSV_COLUMNS, monthlyCsvRows(rows, fiscalYear)),
  }
}

export function notArrivedExport(patients: readonly NotArrivedPatient[], date: Date): CsvFile {
  return {
    filename: `ncd-not-arrived-${dateKeyOf(date)}.csv`,
    csv: toCsv(NOT_ARRIVED_CSV_COLUMNS, notArrivedCsvRows(patients)),
  }
}
