// =============================================================================
// BMS API endpoint resolution — which URL the browser can actually reach.
// Ported from telemed-analysis-v2, where this flow works against real tunnels.
// =============================================================================

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DOH_ENDPOINT,
  LOCAL_API_URL,
  isHstsPreloadedHost,
  needsHstsWorkaround,
  probeLocalApi,
  resolveApiUrl,
  resolveHostToIp,
  resolveHstsSafeApiUrl,
  withRandomParam,
} from '@/services/bmsEndpoint'
import type { ConnectionConfig } from '@/types'

const remoteConfig: ConnectionConfig = {
  apiUrl: 'http://203.151.166.226:30247',
  bearerToken: 'bearer-token-abc',
  databaseType: 'mysql',
  appIdentifier: 'BMS.Dashboard.NCD',
}

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('resolveApiUrl', () => {
  it('MUST rebuild the URL as plain http://host:port when the session names a non-443 port', () => {
    expect(resolveApiUrl('https://11179-a.tunnel.hosxp.net', 30247)).toBe('http://11179-a.tunnel.hosxp.net:30247')
  })

  it('MUST replace an existing port rather than append a second one', () => {
    expect(resolveApiUrl('https://bms.hospital.com:8443', 37903)).toBe('http://bms.hospital.com:37903')
  })

  it('MUST leave the URL untouched when the port is 443 or missing', () => {
    expect(resolveApiUrl('https://bms.hospital.com', 443)).toBe('https://bms.hospital.com')
    expect(resolveApiUrl('https://bms.hospital.com', undefined)).toBe('https://bms.hospital.com')
  })

  it('MUST return undefined when there is no URL', () => {
    expect(resolveApiUrl(undefined, 30247)).toBeUndefined()
  })
})

describe('isHstsPreloadedHost', () => {
  it('MUST match hosxp.net and its subdomains, case-insensitively, with a trailing dot', () => {
    expect(isHstsPreloadedHost('11179-nuttapong.tunnel.hosxp.net')).toBe(true)
    expect(isHstsPreloadedHost('hosxp.net')).toBe(true)
    expect(isHstsPreloadedHost('HOSXP.NET')).toBe(true)
    expect(isHstsPreloadedHost('tunnel.hosxp.net.')).toBe(true)
  })

  it('MUST NOT match unrelated or lookalike domains', () => {
    expect(isHstsPreloadedHost('example.com')).toBe(false)
    expect(isHstsPreloadedHost('not-hosxp.net')).toBe(false)
  })
})

describe('needsHstsWorkaround', () => {
  it('MUST flag plain http on a preloaded host only', () => {
    expect(needsHstsWorkaround('http://a.tunnel.hosxp.net:42488')).toBe(true)
    expect(needsHstsWorkaround('https://a.tunnel.hosxp.net')).toBe(false)
    expect(needsHstsWorkaround('http://localhost:45011')).toBe(false)
  })

  it('MUST be false for undefined or unparsable input', () => {
    expect(needsHstsWorkaround(undefined)).toBe(false)
    expect(needsHstsWorkaround('not a url')).toBe(false)
  })
})

describe('resolveHostToIp', () => {
  it('MUST return the first A record from the DNS-over-HTTPS answer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      Answer: [{ type: 5, data: 'alias.example.com' }, { type: 1, data: '203.151.166.226' }],
    })))
    await expect(resolveHostToIp('a.tunnel.hosxp.net')).resolves.toBe('203.151.166.226')
  })

  it('MUST query the DoH endpoint for an A record of the hostname', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ Answer: [{ type: 1, data: '1.2.3.4' }] }))
    vi.stubGlobal('fetch', fetchMock)
    await resolveHostToIp('a.tunnel.hosxp.net')
    const url = String(fetchMock.mock.calls[0][0])
    expect(url).toContain(DOH_ENDPOINT)
    expect(url).toContain('name=a.tunnel.hosxp.net')
    expect(url).toContain('type=A')
  })

  it('MUST return undefined for AAAA-only answers, failures and non-OK responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ Answer: [{ type: 28, data: '::1' }] })))
    await expect(resolveHostToIp('a.tunnel.hosxp.net')).resolves.toBeUndefined()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(resolveHostToIp('a.tunnel.hosxp.net')).resolves.toBeUndefined()
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({}, false)))
    await expect(resolveHostToIp('a.tunnel.hosxp.net')).resolves.toBeUndefined()
  })
})

describe('resolveHstsSafeApiUrl', () => {
  it('MUST rewrite a plain-http hosxp.net URL to its IP, keeping scheme and port', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ Answer: [{ type: 1, data: '203.151.166.226' }] })))
    await expect(resolveHstsSafeApiUrl('http://a.tunnel.hosxp.net:42488')).resolves.toBe('http://203.151.166.226:42488')
  })

  it('MUST pass a safe URL through without a lookup', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(resolveHstsSafeApiUrl('https://example.com')).resolves.toBe('https://example.com')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('MUST fall back to the hostname when DNS-over-HTTPS is unavailable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('blocked')))
    await expect(resolveHstsSafeApiUrl('http://a.tunnel.hosxp.net:42488')).resolves.toBe('http://a.tunnel.hosxp.net:42488')
  })

  it('MUST return undefined for undefined input', async () => {
    await expect(resolveHstsSafeApiUrl(undefined)).resolves.toBeUndefined()
  })
})

describe('withRandomParam', () => {
  it('MUST add a cache-busting random parameter with ? or & as needed', () => {
    expect(withRandomParam('http://h/api/sql')).toMatch(/^http:\/\/h\/api\/sql\?random=\w+$/)
    expect(withRandomParam('http://h/api/sql?x=1')).toMatch(/^http:\/\/h\/api\/sql\?x=1&random=\w+$/)
    expect(withRandomParam('http://h/a')).not.toBe(withRandomParam('http://h/a'))
  })
})

describe('probeLocalApi', () => {
  it('MUST switch to the local HOSxP gateway when it answers the test query', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ MessageCode: 200, data: [{ test: 1 }] }) })
    vi.stubGlobal('fetch', fetchMock)

    const result = await probeLocalApi(remoteConfig)

    expect(result).toEqual({ config: { ...remoteConfig, apiUrl: LOCAL_API_URL }, isLocal: true })
    expect(String(fetchMock.mock.calls[0][0])).toContain(`${LOCAL_API_URL}/api/sql`)
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer bearer-token-abc')
  })

  it('MUST keep the remote endpoint when the local gateway is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(probeLocalApi(remoteConfig)).resolves.toEqual({ config: remoteConfig, isLocal: false })
  })

  it('MUST keep the remote endpoint when the local gateway rejects the session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ MessageCode: 401 }) }))
    await expect(probeLocalApi(remoteConfig)).resolves.toEqual({ config: remoteConfig, isLocal: false })
  })

  it('MUST send the marketplace token with the probe when there is one', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ MessageCode: 200 }) })
    vi.stubGlobal('fetch', fetchMock)
    await probeLocalApi(remoteConfig, 'mkt-token')
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)['marketplace-token']).toBe('mkt-token')
  })
})
