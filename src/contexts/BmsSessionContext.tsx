import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useBmsSession } from '@/hooks/useBmsSession'
import {
  getMarketplaceToken,
  getSessionCookie,
  getSessionFromUrl,
  handleUrlMarketplaceToken,
  handleUrlSession,
  hasUrlMarketplaceToken,
  removeMarketplaceToken,
} from '@/utils/sessionStorage'

type BmsSessionContextType = ReturnType<typeof useBmsSession>

export const BmsSessionContext = createContext<BmsSessionContextType | null>(null)

interface BmsSessionProviderProps {
  children: ReactNode
}

/**
 * The marketplace token belongs to the session it was launched with:
 * - token in the URL → use it (and remember it)
 * - new session in the URL without a token → forget the old token, which the
 *   server would reject for the new session
 * - reconnecting from the cookie → reuse the remembered token
 */
function resolveMarketplaceToken(): string | undefined {
  if (hasUrlMarketplaceToken()) return handleUrlMarketplaceToken() ?? undefined
  if (getSessionFromUrl()) {
    removeMarketplaceToken()
    return undefined
  }
  return getMarketplaceToken() ?? undefined
}

export function BmsSessionProvider({ children }: BmsSessionProviderProps) {
  const session = useBmsSession()
  const hasConnected = useRef(false)

  useEffect(() => {
    // Prevent double initialization
    if (hasConnected.current) return
    hasConnected.current = true

    const initializeSession = async () => {
      const marketplaceToken = resolveMarketplaceToken()

      const urlSessionId = handleUrlSession()
      if (urlSessionId) {
        await session.connectSession(urlSessionId, marketplaceToken)
        return
      }

      const cookieSessionId = getSessionCookie()
      if (cookieSessionId) {
        await session.connectSession(cookieSessionId, marketplaceToken)
        return
      }

      // No session found, transition to disconnected state
      session.setDisconnected()
    }

    initializeSession()
  }, [session])

  return (
    <BmsSessionContext.Provider value={session}>
      {children}
    </BmsSessionContext.Provider>
  )
}

export function useBmsSessionContext(): BmsSessionContextType {
  const context = useContext(BmsSessionContext)
  if (!context) {
    throw new Error('useBmsSessionContext must be used within a BmsSessionProvider')
  }
  return context
}
