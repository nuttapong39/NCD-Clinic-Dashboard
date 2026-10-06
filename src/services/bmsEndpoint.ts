// =============================================================================
// BMS API endpoint resolution — pick the URL the browser can actually reach.
// Ported from telemed-analysis-v2, where this flow works against real tunnels:
//   1. The tunnel's :443 (`bms_url`) is not the API; the API listens on plain
//      http at `bms_session_port` → http://{host}:{port}
//   2. hosxp.net is HSTS-preloaded, so the browser would upgrade that to https
//      and fail → resolve the host to an IP (DNS-over-HTTPS) and call the IP
//   3. On the HOSxP machine itself the local gateway at 127.0.0.1:45011 is
//      fastest and most reliable → use it whenever it answers
// =============================================================================

import type { ConnectionConfig, SqlApiResponse } from '@/types'

/** Local HOSxP API gateway (runs on the same machine as HOSxP). */
export const LOCAL_API_URL = 'http://127.0.0.1:45011'

/** Fast fail so a missing local gateway does not slow down connecting. */
export const LOCAL_PROBE_TIMEOUT_MS = 3_000

/** CORS-enabled DNS-over-HTTPS resolver. */
export const DOH_ENDPOINT = 'https://dns.google/resolve'

export const HOST_RESOLVE_TIMEOUT_MS = 4_000

/** Suffixes on the HSTS preload list with includeSubDomains. */
export const HSTS_PRELOADED_SUFFIXES = ['hosxp.net']

/** Adds `random=…` so no proxy, tunnel or cache can answer with a stale response. */
export function withRandomParam(url: string): string {
  const separator = url.includes('?') ? '&' : '?'
  const random = `${Date.now()}${Math.random().toString(36).slice(2, 10)}`
  return `${url}${separator}random=${random}`
}

/**
 * API base URL from the session: `http://{host}:{bms_session_port}` when a
 * non-443 port is given (that listener speaks plain http), otherwise `bms_url`.
 */
export function resolveApiUrl(bmsUrl: string | undefined, bmsPort: number | undefined): string | undefined {
  if (!bmsUrl) return undefined
  if (!bmsPort || bmsPort === 443) return bmsUrl
  try {
    return `http://${new URL(bmsUrl).hostname}:${bmsPort}`
  } catch {
    return bmsUrl
  }
}

export function isHstsPreloadedHost(hostname: string): boolean {
  const bare = hostname.replace(/\.$/, '').toLowerCase()
  return HSTS_PRELOADED_SUFFIXES.some((suffix) => bare === suffix || bare.endsWith(`.${suffix}`))
}

/** Plain http on an HSTS-preloaded host — the browser would rewrite it to https. */
export function needsHstsWorkaround(url: string | undefined): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' && isHstsPreloadedHost(parsed.hostname)
  } catch {
    return false
  }
}

/** First IPv4 A record via DNS-over-HTTPS, or undefined when the lookup fails. */
export async function resolveHostToIp(hostname: string): Promise<string | undefined> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), HOST_RESOLVE_TIMEOUT_MS)
  try {
    const response = await fetch(`${DOH_ENDPOINT}?name=${encodeURIComponent(hostname)}&type=A`, { signal: controller.signal })
    if (!response.ok) return undefined
    const payload = (await response.json()) as { Answer?: Array<{ type?: number; data?: string }> }
    return payload.Answer?.find((answer) => answer.type === 1 && /^\d+\.\d+\.\d+\.\d+$/.test(answer.data ?? ''))?.data
  } catch {
    return undefined
  } finally {
    clearTimeout(timeoutId)
  }
}

/** Rewrites an HSTS-affected http URL to `http://{ip}:{port}`; unchanged when safe or unresolvable. */
export async function resolveHstsSafeApiUrl(apiUrl: string | undefined): Promise<string | undefined> {
  if (!apiUrl || !needsHstsWorkaround(apiUrl)) return apiUrl
  try {
    const parsed = new URL(apiUrl)
    const ip = await resolveHostToIp(parsed.hostname)
    if (!ip) return apiUrl
    return `${parsed.protocol}//${ip}${parsed.port ? `:${parsed.port}` : ''}`
  } catch {
    return apiUrl
  }
}

/** Uses the local HOSxP gateway when it accepts this session; otherwise keeps the remote config. */
export async function probeLocalApi(
  config: ConnectionConfig,
  marketplaceToken?: string,
): Promise<{ config: ConnectionConfig; isLocal: boolean }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), LOCAL_PROBE_TIMEOUT_MS)
  try {
    const body: Record<string, string> = { sql: 'SELECT 1 AS test', app: config.appIdentifier }
    if (marketplaceToken) body['marketplace-token'] = marketplaceToken
    const response = await fetch(withRandomParam(`${LOCAL_API_URL}/api/sql`), {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.bearerToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    if (response.ok) {
      const data = (await response.json()) as SqlApiResponse
      if (data.MessageCode === 200) return { config: { ...config, apiUrl: LOCAL_API_URL }, isLocal: true }
    }
  } catch {
    // Unreachable, timed out or blocked — the local gateway is not available
  } finally {
    clearTimeout(timeoutId)
  }
  return { config, isLocal: false }
}
