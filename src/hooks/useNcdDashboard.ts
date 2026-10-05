// =============================================================================
// useNcdDashboard — loads today's appointments (Q1+Q2) and the selected fiscal
// year plus the previous one (Q3+Q4), then hands back processed data.
// =============================================================================

import { useCallback, useEffect, useState } from 'react'
import { useBmsSessionContext } from '@/contexts/BmsSessionContext'
import { useQuery } from '@/hooks/useQuery'
import { MISSED_LIST_LIMIT, ncdQueries } from '@/services/ncdQueries'
import { groupNotArrivedByPatient, summarizeToday } from '@/services/ncdTodayProcessing'
import { normalizeMonthlyClinicRows, normalizeMonthlyRightsRows } from '@/services/ncdMonthlyProcessing'
import { comparisonRange, fiscalYearOf, fiscalYearOptions } from '@/utils/fiscalYear'
import { toFriendlyError } from '@/utils/errorMessages'
import type { SqlApiResponse, SqlParams } from '@/types'
import type { MonthlyClinicRow, MonthlyRightsRow, NotArrivedPatient, TodaySummary } from '@/types/ncd'

interface UseNcdDashboardOptions {
  /** Clock used for "today" and fiscal-year defaults (injectable for tests). */
  now?: () => Date
}

export interface NcdTodayData {
  summary: TodaySummary | null
  notArrived: NotArrivedPatient[]
  notArrivedLimitReached: boolean
  isLoading: boolean
  error: string | null
  lastUpdatedAt: Date | null
}

export interface NcdYearlyData {
  clinicRows: MonthlyClinicRow[]
  rightsRows: MonthlyRightsRow[]
  isLoading: boolean
  error: string | null
}

export interface NcdDashboard {
  fiscalYear: number
  fiscalYearChoices: number[]
  setFiscalYear: (fiscalYear: number) => void
  /** The moment the data was last requested; drives "future month" and YTD logic. */
  asOf: Date
  today: NcdTodayData
  yearly: NcdYearlyData
  refresh: () => void
}

function rowsOf(response: SqlApiResponse): Record<string, unknown>[] {
  if (response.MessageCode !== 200) {
    throw new Error(response.Message || `SQL API returned MessageCode ${response.MessageCode}`)
  }
  return response.data ?? []
}

function dateRangeParams(fiscalYear: number): SqlParams {
  const range = comparisonRange(fiscalYear)
  return {
    start_date: { value: range.start, value_type: 'date' },
    end_date: { value: range.end, value_type: 'date' },
  }
}

export function useNcdDashboard({ now = () => new Date() }: UseNcdDashboardOptions = {}): NcdDashboard {
  const session = useBmsSessionContext()
  const { executeQuery } = session
  const isConnected = session.sessionState === 'connected'
  const dbType = session.connectionConfig?.databaseType ?? 'mysql'

  const [clock] = useState(() => now)
  const [currentFiscalYear] = useState(() => fiscalYearOf(clock()))
  const [fiscalYear, setFiscalYear] = useState(currentFiscalYear)
  const [asOf, setAsOf] = useState(() => clock())
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)

  const runRows = useCallback(
    async (sql: string, params?: SqlParams) => rowsOf(await executeQuery(sql, params)),
    [executeQuery],
  )

  const todayQuery = useQuery({
    queryFn: async () => {
      const [summaryRows, notArrivedRows] = await Promise.all([
        runRows(ncdQueries.getNcdAppointmentSummaryToday(dbType)),
        runRows(ncdQueries.getNcdMissedAppointmentsToday(dbType)),
      ])
      return {
        summary: summarizeToday(summaryRows),
        notArrived: groupNotArrivedByPatient(notArrivedRows),
        limitReached: notArrivedRows.length >= MISSED_LIST_LIMIT,
      }
    },
    onSuccess: () => setLastUpdatedAt(clock()),
  })

  const yearlyQuery = useQuery({
    queryFn: async () => {
      const params = dateRangeParams(fiscalYear)
      const [clinicRows, rightsRows] = await Promise.all([
        runRows(ncdQueries.getNcdMonthlyAppointmentsByClinic(dbType), params),
        runRows(ncdQueries.getNcdMonthlyAttendedByRightsGroup(dbType), params),
      ])
      return {
        clinicRows: normalizeMonthlyClinicRows(clinicRows),
        rightsRows: normalizeMonthlyRightsRows(rightsRows),
      }
    },
  })

  const { execute: loadToday } = todayQuery
  const { execute: loadYearly } = yearlyQuery

  useEffect(() => {
    if (isConnected) void loadToday()
  }, [isConnected, loadToday])

  useEffect(() => {
    if (isConnected) void loadYearly()
  }, [isConnected, fiscalYear, loadYearly])

  const refresh = useCallback(() => {
    setAsOf(clock())
    void loadToday()
    void loadYearly()
  }, [clock, loadToday, loadYearly])

  return {
    fiscalYear,
    fiscalYearChoices: fiscalYearOptions(currentFiscalYear),
    setFiscalYear,
    asOf,
    today: {
      summary: todayQuery.data?.summary ?? null,
      notArrived: todayQuery.data?.notArrived ?? [],
      notArrivedLimitReached: todayQuery.data?.limitReached ?? false,
      isLoading: todayQuery.state === 'idle' || todayQuery.isLoading,
      error: todayQuery.error ? toFriendlyError(todayQuery.error) : null,
      lastUpdatedAt,
    },
    yearly: {
      clinicRows: yearlyQuery.data?.clinicRows ?? [],
      rightsRows: yearlyQuery.data?.rightsRows ?? [],
      isLoading: yearlyQuery.state === 'idle' || yearlyQuery.isLoading,
      error: yearlyQuery.error ? toFriendlyError(yearlyQuery.error) : null,
    },
    refresh,
  }
}
