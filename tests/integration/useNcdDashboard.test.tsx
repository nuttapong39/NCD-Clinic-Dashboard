// =============================================================================
// Integration: useNcdDashboard with the real session provider, queue and
// processing. Only the network is faked (fetch stub — MSW's Node interceptor
// rejects jsdom's AbortSignal).
// =============================================================================

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { BmsSessionProvider } from '@/contexts/BmsSessionContext'
import { useNcdDashboard } from '@/hooks/useNcdDashboard'
import { clearApiQueue } from '@/services/bmsSession'

const NOW = new Date(2025, 10, 15, 10, 42) // 15 Nov 2025 → fiscal year 2569
const API_URL = 'https://bms.test'

const sessionResponse = {
  result: {
    system_info: { version: '1.0', environment: 'test' },
    user_info: {
      name: 'Tester',
      position: 'Nurse',
      position_id: 1,
      hospital_code: '10999',
      doctor_code: '',
      department: 'NCD',
      location: 'รพ.ทดสอบ',
      is_hr_admin: false,
      is_director: false,
      bms_url: API_URL,
      bms_session_port: 443,
      bms_session_code: 'test-token',
      bms_database_name: 'hos',
      bms_database_type: 'PostgreSQL',
    },
    key_value: 'test-token',
    expired_second: 3600,
  },
  MessageCode: 200,
  Message: 'OK',
  RequestTime: '2025-11-15T03:42:00Z',
}

const todayRows = [
  { standard_ncd_code: '001', disease_name: 'เบาหวาน', local_clinic_code: '010', local_clinic_name: 'คลินิกเบาหวาน', appt_today: 40, came: 30, not_arrived: 10 },
  { standard_ncd_code: '002', disease_name: 'ความดัน', local_clinic_code: '015', local_clinic_name: 'คลินิกความดัน', appt_today: 20, came: 18, not_arrived: 2 },
]

const notArrivedRows = [
  { standard_ncd_code: '001', oapp_id: 1, hn: '000123', patient_name: 'นายสมชาย ใจดี', nexttime: '08:00:00', local_clinic_code: '010', clinic_name: 'คลินิกเบาหวาน', doctor: 'D1', note: null },
  { standard_ncd_code: '002', oapp_id: 2, hn: '000123', patient_name: 'นายสมชาย ใจดี', nexttime: '09:00:00', local_clinic_code: '015', clinic_name: 'คลินิกความดัน', doctor: 'D2', note: null },
]

const monthlyRows = [
  { yr: 2025, mo: 10, standard_ncd_code: '001', local_clinic_code: '010', local_clinic_name: 'คลินิกเบาหวาน', appt: 300, came: 270, missed: 30, not_arrived_today: 0, upcoming: 0 },
  { yr: 2024, mo: 10, standard_ncd_code: '001', local_clinic_code: '010', local_clinic_name: 'คลินิกเบาหวาน', appt: 280, came: 250, missed: 30, not_arrived_today: 0, upcoming: 0 },
]

const rightsRows = [{ yr: 2025, mo: 10, hipdata_code: 'UCS', came: 200 }]

interface SqlCall {
  sql: string
  params?: Record<string, { value: string; value_type: string }>
}

type SqlOverride = (call: SqlCall) => Response | undefined

let sqlCalls: SqlCall[] = []
let sqlOverride: SqlOverride = () => undefined

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

function sqlResult(data: unknown[]): Response {
  return json({ result: {}, MessageCode: 200, Message: 'OK', RequestTime: '', data, record_count: data.length })
}

function rowsFor(sql: string): unknown[] {
  if (sql.includes('VERSION()')) return [{ version: 'PostgreSQL 15.4' }]
  if (sql.includes('AS appt_today')) return todayRows
  if (sql.includes('AS patient_name')) return notArrivedRows
  if (sql.includes('hipdata_code')) return rightsRows
  if (sql.includes('AS upcoming')) return monthlyRows
  throw new Error(`Unexpected SQL: ${sql}`)
}

async function fakeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = String(input)
  if (url.includes('PasteJSON')) return json(sessionResponse)
  if (url === `${API_URL}/api/sql`) {
    const call = JSON.parse(String(init?.body)) as SqlCall
    sqlCalls.push(call)
    return sqlOverride(call) ?? sqlResult(rowsFor(call.sql))
  }
  throw new Error(`Unexpected request: ${url}`)
}

function wrapper({ children }: { children: ReactNode }) {
  return <BmsSessionProvider>{children}</BmsSessionProvider>
}

function renderDashboard() {
  return renderHook(() => useNcdDashboard({ now: () => NOW }), { wrapper })
}

function monthlyCalls(): SqlCall[] {
  return sqlCalls.filter((call) => call.sql.includes('AS upcoming'))
}

beforeEach(() => {
  sqlCalls = []
  sqlOverride = () => undefined
  window.history.replaceState({}, '', '/?bms-session-id=TEST-SESSION')
  vi.stubGlobal('fetch', vi.fn(fakeFetch))
})

afterEach(() => {
  clearApiQueue()
  vi.unstubAllGlobals()
  document.cookie = 'bms-session-id=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
})

describe('useNcdDashboard', () => {
  it('MUST load today summary and not-yet-arrived patients once the session connects', async () => {
    const { result } = renderDashboard()

    await waitFor(() => expect(result.current.today.summary).not.toBeNull())

    expect(result.current.today.summary).toMatchObject({ appointments: 60, came: 48, notArrived: 12 })
    expect(result.current.today.notArrived).toHaveLength(1)
    expect(result.current.today.notArrived[0].clinics.map((clinic) => clinic.clinicCode)).toEqual(['010', '015'])
    expect(result.current.today.notArrivedLimitReached).toBe(false)
    expect(result.current.today.lastUpdatedAt).toEqual(NOW)
    expect(result.current.today.error).toBeNull()
  })

  it('MUST load the selected fiscal year plus the previous one using bound date parameters', async () => {
    const { result } = renderDashboard()

    await waitFor(() => expect(result.current.yearly.clinicRows).toHaveLength(2))

    expect(result.current.fiscalYear).toBe(2569)
    expect(monthlyCalls()[0].params).toEqual({
      start_date: { value: '2024-10-01', value_type: 'date' },
      end_date: { value: '2026-09-30', value_type: 'date' },
    })
    expect(result.current.yearly.rightsRows).toEqual([{ month: '2025-10', rightsGroup: 'uc', came: 200 }])
  })

  it('MUST reload yearly data with the new range when the fiscal year changes', async () => {
    const { result } = renderDashboard()
    await waitFor(() => expect(result.current.yearly.clinicRows).toHaveLength(2))

    act(() => result.current.setFiscalYear(2568))

    await waitFor(() => expect(monthlyCalls()).toHaveLength(2))
    expect(monthlyCalls()[1].params?.start_date.value).toBe('2023-10-01')
    await waitFor(() => expect(result.current.yearly.isLoading).toBe(false))
    expect(result.current.fiscalYear).toBe(2568)
  })

  it('MUST re-run every query when refreshed', async () => {
    const { result } = renderDashboard()
    await waitFor(() => expect(result.current.yearly.clinicRows).toHaveLength(2))
    const callsBefore = sqlCalls.length

    act(() => result.current.refresh())

    await waitFor(() => expect(sqlCalls.length).toBe(callsBefore + 4))
  })

  it('MUST report a friendly Thai error for today while still loading the yearly data', async () => {
    sqlOverride = (call) => (call.sql.includes('AS appt_today') ? json({ error: 'boom' }, 503) : undefined)
    const { result } = renderDashboard()

    await waitFor(() => expect(result.current.today.error).not.toBeNull())

    expect(result.current.today.error).toBe('ดึงข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง')
    expect(result.current.today.summary).toBeNull()
    await waitFor(() => expect(result.current.yearly.clinicRows).toHaveLength(2))
  })

  it('MUST treat a non-200 MessageCode in the SQL response as an error', async () => {
    sqlOverride = (call) =>
      call.sql.includes('hipdata_code')
        ? json({ result: {}, MessageCode: 409, Message: 'column pt.hipdata_code does not exist', RequestTime: '' })
        : undefined
    const { result } = renderDashboard()

    await waitFor(() => expect(result.current.yearly.error).not.toBeNull())
    expect(result.current.yearly.clinicRows).toEqual([])
  })

  it('MUST flag when the not-yet-arrived list reached the row limit', async () => {
    const fullList = Array.from({ length: 1000 }, (_, index) => ({
      ...notArrivedRows[0],
      oapp_id: index,
      hn: String(index).padStart(6, '0'),
    }))
    sqlOverride = (call) => (call.sql.includes('AS patient_name') ? sqlResult(fullList) : undefined)
    const { result } = renderDashboard()

    await waitFor(() => expect(result.current.today.notArrived).toHaveLength(1000))
    expect(result.current.today.notArrivedLimitReached).toBe(true)
  })
})
