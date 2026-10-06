import { useState, useCallback, useRef } from 'react'
import type {
  Session,
  SessionState,
  DatabaseType,
  ConnectionConfig,
  SqlApiResponse,
  SqlParams,
} from '@/types'
import {
  retrieveBmsSession,
  extractConnectionConfig,
  extractUserInfo,
  extractSystemInfo,
  executeSqlViaApiQueued,
  clearApiQueue,
  detectDatabaseType,
} from '@/services/bmsSession'
import { probeLocalApi, resolveHstsSafeApiUrl } from '@/services/bmsEndpoint'
import { apiQueue } from '@/services/apiQueue'
import {
  setSessionCookie,
  removeSessionCookie,
} from '@/utils/sessionStorage'

interface UseBmsSessionResult {
  session: Session | null
  sessionState: SessionState
  connectionConfig: ConnectionConfig | null
  error: Error | null
  connectSession: (sessionId: string, marketplaceToken?: string) => Promise<boolean>
  disconnectSession: () => void
  setDisconnected: () => void
  refreshSession: () => Promise<boolean>
  executeQuery: (sql: string, params?: SqlParams) => Promise<SqlApiResponse>
}

const LOCAL_MAX_CONCURRENT = 5
const REMOTE_MAX_CONCURRENT = 1

export function useBmsSession(): UseBmsSessionResult {
  const [session, setSession] = useState<Session | null>(null)
  const [sessionState, setSessionState] = useState<SessionState>('idle')
  const [connectionConfig, setConnectionConfig] = useState<ConnectionConfig | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [lastSessionId, setLastSessionId] = useState<string | null>(null)
  const marketplaceTokenRef = useRef<string | undefined>(undefined)

  const connectSession = useCallback(async (sessionId: string, marketplaceToken?: string): Promise<boolean> => {
    setSessionState('connecting')
    setError(null)
    setLastSessionId(sessionId)
    marketplaceTokenRef.current = marketplaceToken

    try {
      const response = await retrieveBmsSession(sessionId)

      if (response.MessageCode !== 200) {
        throw new Error(
          response.MessageCode === 500
            ? 'Session has expired. Please enter a new session ID.'
            : `Session retrieval failed: ${response.Message || 'Unknown error'}`
        )
      }

      // Endpoint choice follows telemed-analysis-v2: http on the session port,
      // an IP instead of the HSTS-preloaded hostname, and the local HOSxP
      // gateway whenever it answers (see services/bmsEndpoint.ts).
      const extracted = extractConnectionConfig(response)
      const remoteConfig: ConnectionConfig = {
        ...extracted,
        apiUrl: (await resolveHstsSafeApiUrl(extracted.apiUrl)) ?? extracted.apiUrl,
      }
      const { config, isLocal } = await probeLocalApi(remoteConfig, marketplaceToken)
      // The tunnel serves one request at a time per session; the local gateway can take several
      apiQueue.setMaxConcurrent(isLocal ? LOCAL_MAX_CONCURRENT : REMOTE_MAX_CONCURRENT)

      const userInfo = extractUserInfo(response)
      const systemInfo = extractSystemInfo(response)

      const dbType: DatabaseType = await detectDatabaseType(config, marketplaceToken)
      const updatedConfig: ConnectionConfig = { ...config, databaseType: dbType }

      const newSession: Session = {
        sessionId,
        apiUrl: updatedConfig.apiUrl,
        bearerToken: updatedConfig.bearerToken,
        databaseType: dbType,
        databaseName: response.result?.user_info?.bms_database_name ?? '',
        expirySeconds: response.result?.expired_second ?? 36000,
        connectedAt: new Date(),
        userInfo,
        systemInfo,
        isLocalApi: isLocal,
      }

      setSession(newSession)
      setConnectionConfig(updatedConfig)
      setSessionState('connected')
      setSessionCookie(sessionId)

      return true
    } catch (err) {
      const sessionError = err instanceof Error ? err : new Error(String(err))
      setError(sessionError)
      setSessionState('disconnected')
      return false
    }
  }, [])

  const disconnectSession = useCallback(() => {
    clearApiQueue()
    setSession(null)
    setConnectionConfig(null)
    setSessionState('disconnected')
    setError(null)
    removeSessionCookie()
  }, [])

  const refreshSession = useCallback(async (): Promise<boolean> => {
    if (!lastSessionId) return false
    return connectSession(lastSessionId)
  }, [lastSessionId, connectSession])

  const executeQuery = useCallback(async (sql: string, params?: SqlParams): Promise<SqlApiResponse> => {
    if (!connectionConfig) {
      throw new Error('Not connected. Please connect with a valid session ID first.')
    }

    try {
      const result = await executeSqlViaApiQueued(sql, connectionConfig, params, marketplaceTokenRef.current)

      if (result.MessageCode === 500 || result.MessageCode === 501) {
        setSessionState('expired')
        setError(new Error('Session has expired. Please reconnect.'))
      }

      return result
    } catch (err) {
      if (err instanceof Error && err.message.includes('unauthorized')) {
        setSessionState('expired')
        setError(new Error('Session has expired. Please reconnect.'))
      }
      throw err
    }
  }, [connectionConfig])

  const setDisconnected = useCallback(() => {
    setSessionState('disconnected')
  }, [])

  return {
    session,
    sessionState,
    connectionConfig,
    error,
    connectSession,
    disconnectSession,
    setDisconnected,
    refreshSession,
    executeQuery,
  }
}
