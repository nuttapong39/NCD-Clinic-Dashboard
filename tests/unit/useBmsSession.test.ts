// =============================================================================
// useBmsSession hook tests
// Tests session lifecycle: connect, disconnect, query execution, error states
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBmsSession } from '@/hooks/useBmsSession'
import type { BmsSessionResponse, ConnectionConfig, SqlApiResponse } from '@/types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/services/bmsSession', () => ({
  retrieveBmsSession: vi.fn(),
  extractConnectionConfig: vi.fn(),
  extractUserInfo: vi.fn(),
  extractSystemInfo: vi.fn(),
  executeSqlViaApiQueued: vi.fn(),
  clearApiQueue: vi.fn(),
  detectDatabaseType: vi.fn(),
}))

vi.mock('@/utils/sessionStorage', () => ({
  setSessionCookie: vi.fn(),
  removeSessionCookie: vi.fn(),
}))

import {
  retrieveBmsSession,
  extractConnectionConfig,
  extractUserInfo,
  extractSystemInfo,
  executeSqlViaApiQueued,
  clearApiQueue,
  detectDatabaseType,
} from '@/services/bmsSession'
import { setSessionCookie, removeSessionCookie } from '@/utils/sessionStorage'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeBmsSessionResponse(
  overrides?: Partial<BmsSessionResponse>,
): BmsSessionResponse {
  return {
    MessageCode: 200,
    Message: 'success',
    RequestTime: '2026-01-01T00:00:00Z',
    result: {
      system_info: { version: '2.0.0', environment: 'production' },
      user_info: {
        name: 'Dr. Smith',
        position: 'Physician',
        position_id: 10,
        hospital_code: 'H001',
        doctor_code: 'D001',
        department: 'Internal Medicine',
        location: 'Building A',
        is_hr_admin: false,
        is_director: true,
        bms_url: 'https://bms.hospital.com',
        bms_session_port: 443,
        bms_session_code: 'bearer-token-abc',
        bms_database_name: 'hospital_db',
        bms_database_type: 'mysql',
      },
      key_value: 'fallback-token',
      expired_second: 36000,
    },
    ...overrides,
  }
}

function makeConnectionConfig(
  overrides?: Partial<ConnectionConfig>,
): ConnectionConfig {
  return {
    apiUrl: 'https://bms.hospital.com',
    bearerToken: 'bearer-token-abc',
    databaseType: 'mysql',
    appIdentifier: 'BMS.Dashboard.NCD',
    ...overrides,
  }
}

function makeSqlApiResponse(
  overrides?: Partial<SqlApiResponse>,
): SqlApiResponse {
  return {
    result: {},
    MessageCode: 200,
    Message: 'OK',
    RequestTime: '2026-01-01T00:00:00Z',
    data: [{ count: 5 }],
    field: [3],
    field_name: ['count'],
    record_count: 1,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()

  // Default successful connection mocks
  vi.mocked(retrieveBmsSession).mockResolvedValue(makeBmsSessionResponse())
  vi.mocked(extractConnectionConfig).mockReturnValue(makeConnectionConfig())
  vi.mocked(extractUserInfo).mockReturnValue({
    name: 'Dr. Smith',
    position: 'Physician',
    positionId: 10,
    hospitalCode: 'H001',
    doctorCode: 'D001',
    department: 'Internal Medicine',
    location: 'Building A',
    isHrAdmin: false,
    isDirector: true,
  })
  vi.mocked(extractSystemInfo).mockReturnValue({
    version: '2.0.0',
    environment: 'production',
  })
  vi.mocked(detectDatabaseType).mockResolvedValue('mysql')
  vi.mocked(executeSqlViaApiQueued).mockResolvedValue(makeSqlApiResponse())
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useBmsSession', () => {
  it('MUST return idle sessionState initially', () => {
    const { result } = renderHook(() => useBmsSession())

    expect(result.current.sessionState).toBe('idle')
    expect(result.current.session).toBeNull()
    expect(result.current.connectionConfig).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('MUST set sessionState to connecting when connectSession is called', async () => {
    // Hold the retrieveBmsSession promise so we can observe 'connecting'
    let resolveSession!: (value: BmsSessionResponse) => void
    vi.mocked(retrieveBmsSession).mockReturnValue(
      new Promise<BmsSessionResponse>((resolve) => { resolveSession = resolve })
    )

    const { result } = renderHook(() => useBmsSession())

    // Start connecting without awaiting
    act(() => {
      void result.current.connectSession('test-session-id')
    })

    expect(result.current.sessionState).toBe('connecting')

    // Clean up — resolve so no pending promise leaks
    await act(async () => {
      resolveSession(makeBmsSessionResponse())
    })
  })

  it('MUST set sessionState to connected after successful connection', async () => {
    const { result } = renderHook(() => useBmsSession())

    await act(async () => {
      await result.current.connectSession('test-session-id')
    })

    expect(result.current.sessionState).toBe('connected')
    expect(result.current.session).not.toBeNull()
    expect(result.current.session?.sessionId).toBe('test-session-id')
    expect(result.current.connectionConfig).toEqual(makeConnectionConfig({ databaseType: 'mysql' }))
    expect(result.current.error).toBeNull()
  })

  it('MUST set sessionState to disconnected on connection error', async () => {
    vi.mocked(retrieveBmsSession).mockRejectedValue(new Error('Network failure'))

    const { result } = renderHook(() => useBmsSession())

    await act(async () => {
      await result.current.connectSession('bad-session-id')
    })

    expect(result.current.sessionState).toBe('disconnected')
    expect(result.current.session).toBeNull()
  })

  it('MUST call retrieveBmsSession with session ID', async () => {
    const { result } = renderHook(() => useBmsSession())

    await act(async () => {
      await result.current.connectSession('my-session-123')
    })

    expect(retrieveBmsSession).toHaveBeenCalledWith('my-session-123')
  })

  it('MUST set error when session retrieval fails', async () => {
    const errorMessage = 'Session service unavailable'
    vi.mocked(retrieveBmsSession).mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useBmsSession())

    await act(async () => {
      await result.current.connectSession('failing-session')
    })

    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toBe(errorMessage)
  })

  it('MUST return false when connectSession fails', async () => {
    vi.mocked(retrieveBmsSession).mockRejectedValue(new Error('Failure'))

    const { result } = renderHook(() => useBmsSession())

    let returnValue!: boolean
    await act(async () => {
      returnValue = await result.current.connectSession('failing-session')
    })

    expect(returnValue).toBe(false)
  })

  it('MUST return true when connectSession succeeds', async () => {
    const { result } = renderHook(() => useBmsSession())

    let returnValue!: boolean
    await act(async () => {
      returnValue = await result.current.connectSession('good-session')
    })

    expect(returnValue).toBe(true)
  })

  it('MUST execute SQL query via executeSqlViaApiQueued', async () => {
    const { result } = renderHook(() => useBmsSession())

    await act(async () => {
      await result.current.connectSession('test-session-id')
    })

    const sqlResponse = makeSqlApiResponse({ data: [{ total: 100 }] })
    vi.mocked(executeSqlViaApiQueued).mockResolvedValue(sqlResponse)

    let queryResult!: SqlApiResponse
    await act(async () => {
      queryResult = await result.current.executeQuery('SELECT COUNT(*) as total FROM patient')
    })

    expect(executeSqlViaApiQueued).toHaveBeenCalledWith(
      'SELECT COUNT(*) as total FROM patient',
      expect.objectContaining({ apiUrl: 'https://bms.hospital.com' }),
      undefined,
      undefined
    )
    expect(queryResult).toEqual(sqlResponse)
  })

  it('MUST forward bound parameters to executeSqlViaApiQueued', async () => {
    const { result } = renderHook(() => useBmsSession())

    await act(async () => {
      await result.current.connectSession('test-session-id')
    })

    vi.mocked(executeSqlViaApiQueued).mockResolvedValue(makeSqlApiResponse())
    const params = { start_date: { value: '2024-10-01', value_type: 'date' } }

    await act(async () => {
      await result.current.executeQuery('SELECT :start_date', params)
    })

    expect(executeSqlViaApiQueued).toHaveBeenCalledWith(
      'SELECT :start_date',
      expect.objectContaining({ apiUrl: 'https://bms.hospital.com' }),
      params,
      undefined
    )
  })

  it('MUST throw error from executeQuery when not connected', async () => {
    const { result } = renderHook(() => useBmsSession())

    await expect(
      act(async () => {
        await result.current.executeQuery('SELECT 1')
      })
    ).rejects.toThrow('Not connected')
  })

  it('MUST set sessionState to expired on HTTP 500 response', async () => {
    const { result } = renderHook(() => useBmsSession())

    await act(async () => {
      await result.current.connectSession('test-session-id')
    })

    vi.mocked(executeSqlViaApiQueued).mockResolvedValue(
      makeSqlApiResponse({ MessageCode: 500, Message: 'Internal Server Error' })
    )

    await act(async () => {
      await result.current.executeQuery('SELECT 1')
    })

    expect(result.current.sessionState).toBe('expired')
    expect(result.current.error).toBeInstanceOf(Error)
    expect(result.current.error?.message).toContain('expired')
  })

  it('MUST set sessionState to expired on HTTP 501 response', async () => {
    const { result } = renderHook(() => useBmsSession())

    await act(async () => {
      await result.current.connectSession('test-session-id')
    })

    vi.mocked(executeSqlViaApiQueued).mockResolvedValue(
      makeSqlApiResponse({ MessageCode: 501, Message: 'Unauthorized' })
    )

    await act(async () => {
      await result.current.executeQuery('SELECT 1')
    })

    expect(result.current.sessionState).toBe('expired')
  })

  it('MUST clear session data on disconnectSession', async () => {
    const { result } = renderHook(() => useBmsSession())

    await act(async () => {
      await result.current.connectSession('test-session-id')
    })

    expect(result.current.session).not.toBeNull()
    expect(result.current.sessionState).toBe('connected')

    act(() => {
      result.current.disconnectSession()
    })

    expect(result.current.session).toBeNull()
    expect(result.current.connectionConfig).toBeNull()
    expect(result.current.sessionState).toBe('disconnected')
    expect(result.current.error).toBeNull()
    expect(clearApiQueue).toHaveBeenCalled()
    expect(removeSessionCookie).toHaveBeenCalled()
  })

  it('MUST save session cookie on successful connection', async () => {
    const { result } = renderHook(() => useBmsSession())

    await act(async () => {
      await result.current.connectSession('my-session-id')
    })

    expect(setSessionCookie).toHaveBeenCalledWith('my-session-id')
  })

  it('MUST set sessionState to expired when executeSqlViaApiQueued throws unauthorized error', async () => {
    const { result } = renderHook(() => useBmsSession())

    await act(async () => {
      await result.current.connectSession('test-session-id')
    })

    vi.mocked(executeSqlViaApiQueued).mockRejectedValue(
      new Error('Session unauthorized. Please reconnect.')
    )

    let thrownError: Error | null = null
    await act(async () => {
      try {
        await result.current.executeQuery('SELECT 1')
      } catch (err) {
        thrownError = err as Error
      }
    })

    expect(thrownError).not.toBeNull()
    expect((thrownError as unknown as Error).message).toContain('unauthorized')
    expect(result.current.sessionState).toBe('expired')
  })

  it('MUST set sessionState to expired when MessageCode is 500 (session expired case)', async () => {
    vi.mocked(retrieveBmsSession).mockResolvedValue(
      makeBmsSessionResponse({ MessageCode: 500, Message: 'Session expired' })
    )

    const { result } = renderHook(() => useBmsSession())

    await act(async () => {
      await result.current.connectSession('expired-session')
    })

    expect(result.current.sessionState).toBe('disconnected')
    expect(result.current.error?.message).toContain('expired')
  })
})
