// =============================================================================
// Integration: which BMS endpoint the app connects to, and the marketplace
// token. Real provider, hook and services; only the network (fetch) is faked.
// =============================================================================

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { BmsSessionProvider, useBmsSessionContext } from '@/contexts/BmsSessionContext'
import { clearApiQueue } from '@/services/bmsSession'
import { LOCAL_API_URL } from '@/services/bmsEndpoint'
import { MARKETPLACE_TOKEN_KEY } from '@/utils/sessionStorage'

const TUNNEL_HOST = '11179-test.tunnel.hosxp.net'
const TUNNEL_IP = '203.151.166.226'
const SESSION_PORT = 30247

function sessionResponse() {
  return {
    MessageCode: 200,
    Message: 'OK',
    RequestTime: '',
    result: {
      system_info: { version: '1.0', environment: 'test' },
      user_info: {
        name: 'Tester', position: 'Nurse', position_id: 1, hospital_code: '10999', doctor_code: '',
        department: 'NCD', location: 'รพ.ทดสอบ', is_hr_admin: false, is_director: false,
        bms_url: `https://${TUNNEL_HOST}`, bms_session_port: SESSION_PORT, bms_session_code: 'session-token',
        bms_database_name: 'hos', bms_database_type: 'PostgreSQL',
      },
      key_value: 'session-token',
      expired_second: 3600,
    },
  }
}

interface SqlCall {
  url: string
  body: Record<string, unknown>
}

let sqlCalls: SqlCall[] = []
let localGatewayUp = true

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

async function fakeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = String(input)
  if (url.includes('PasteJSON')) return json(sessionResponse())
  if (url.startsWith('https://dns.google/resolve')) return json({ Answer: [{ type: 1, data: TUNNEL_IP }] })
  if (url.includes('/api/sql')) {
    if (url.startsWith(LOCAL_API_URL) && !localGatewayUp) throw new TypeError('Failed to fetch')
    if (url.startsWith(`https://${TUNNEL_HOST}`)) return new Response('', { status: 502 })
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>
    sqlCalls.push({ url, body })
    return json({ result: {}, MessageCode: 200, Message: 'OK', RequestTime: '', data: [{ version: 'PostgreSQL 15.4', test: 1 }] })
  }
  throw new Error(`Unexpected request: ${url}`)
}

function wrapper({ children }: { children: ReactNode }) {
  return <BmsSessionProvider>{children}</BmsSessionProvider>
}

async function connect(search: string) {
  window.history.replaceState({}, '', `/${search}`)
  const view = renderHook(() => useBmsSessionContext(), { wrapper })
  await waitFor(() => expect(view.result.current.sessionState).toBe('connected'))
  return view
}

beforeEach(() => {
  sqlCalls = []
  localGatewayUp = true
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn(fakeFetch))
})

afterEach(() => {
  clearApiQueue()
  vi.unstubAllGlobals()
  document.cookie = 'bms-session-id=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
})

describe('connect flow', () => {
  it('MUST use the local HOSxP gateway when it answers on this machine', async () => {
    const { result } = await connect('?bms-session-id=SESSION-1')

    expect(result.current.connectionConfig?.apiUrl).toBe(LOCAL_API_URL)
    expect(result.current.session?.isLocalApi).toBe(true)
    expect(result.current.connectionConfig?.databaseType).toBe('postgresql')
  })

  it('MUST fall back to http://{tunnel IP}:{session port} when there is no local gateway', async () => {
    localGatewayUp = false
    const { result } = await connect('?bms-session-id=SESSION-2')

    expect(result.current.connectionConfig?.apiUrl).toBe(`http://${TUNNEL_IP}:${SESSION_PORT}`)
    expect(result.current.session?.isLocalApi).toBe(false)
    expect(sqlCalls.some((call) => call.url.startsWith(`http://${TUNNEL_IP}:${SESSION_PORT}/api/sql`))).toBe(true)
  })

  it('MUST never send queries to the tunnel :443 address that answers 502', async () => {
    localGatewayUp = false
    await connect('?bms-session-id=SESSION-3')

    const fetchMock = vi.mocked(fetch)
    const tunnelCalls = fetchMock.mock.calls.filter(([input]) => String(input).startsWith(`https://${TUNNEL_HOST}`))
    expect(tunnelCalls).toEqual([])
  })

  it('MUST forward the marketplace token from the launch URL with every query', async () => {
    const { result } = await connect('?bms-session-id=SESSION-4&marketplace_token=mkt-abc')

    await result.current.executeQuery('SELECT 1')

    expect(sqlCalls.length).toBeGreaterThan(0)
    expect(sqlCalls.every((call) => call.body['marketplace-token'] === 'mkt-abc')).toBe(true)
    expect(window.location.search).not.toContain('marketplace')
  })

  it('MUST drop a stored marketplace token when a new session arrives without one', async () => {
    localStorage.setItem(MARKETPLACE_TOKEN_KEY, 'stale-token')
    const { result } = await connect('?bms-session-id=SESSION-5')

    await result.current.executeQuery('SELECT 1')

    expect(sqlCalls.every((call) => !('marketplace-token' in call.body))).toBe(true)
    expect(localStorage.getItem(MARKETPLACE_TOKEN_KEY)).toBeNull()
  })
})
