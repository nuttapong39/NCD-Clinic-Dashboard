import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'
import { useBmsSession } from '@/hooks/useBmsSession'
import { handleUrlSession, getSessionCookie } from '@/utils/sessionStorage'

type BmsSessionContextType = ReturnType<typeof useBmsSession>

export const BmsSessionContext = createContext<BmsSessionContextType | null>(null)

interface BmsSessionProviderProps {
  children: ReactNode
}

export function BmsSessionProvider({ children }: BmsSessionProviderProps) {
  const session = useBmsSession()
  const hasConnected = useRef(false)

  useEffect(() => {
    // Prevent double initialization
    if (hasConnected.current) return
    hasConnected.current = true

    const initializeSession = async () => {
      const urlSessionId = handleUrlSession()
      if (urlSessionId) {
        await session.connectSession(urlSessionId)
        return
      }

      const cookieSessionId = getSessionCookie()
      if (cookieSessionId) {
        await session.connectSession(cookieSessionId)
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
