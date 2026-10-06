// =============================================================================
// BmsSessionContext tests
// Tests provider setup, context hook, and auto-connect behavior
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BmsSessionProvider, useBmsSessionContext } from '@/contexts/BmsSessionContext'
import type { SessionState, ConnectionConfig, Session, SqlApiResponse } from '@/types'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/hooks/useBmsSession', () => ({
  useBmsSession: vi.fn(),
}))

vi.mock('@/utils/sessionStorage', () => ({
  handleUrlSession: vi.fn(),
  getSessionCookie: vi.fn(),
  setSessionCookie: vi.fn(),
  removeSessionCookie: vi.fn(),
  getSessionFromUrl: vi.fn(() => null),
  hasUrlMarketplaceToken: vi.fn(() => false),
  handleUrlMarketplaceToken: vi.fn(() => null),
  getMarketplaceToken: vi.fn(() => null),
  removeMarketplaceToken: vi.fn(),
}))

import { useBmsSession } from '@/hooks/useBmsSession'
import { handleUrlSession, getSessionCookie } from '@/utils/sessionStorage'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockSession: Session = {
  sessionId: 'test-session-id',
  apiUrl: 'https://bms.hospital.com',
  bearerToken: 'bearer-token-abc',
  databaseType: 'mysql',
  databaseName: 'hospital_db',
  expirySeconds: 36000,
  connectedAt: new Date(),
  isLocalApi: false,
  userInfo: {
    name: 'Dr. Smith',
    position: 'Physician',
    positionId: 10,
    hospitalCode: 'H001',
    doctorCode: 'D001',
    department: 'Internal Medicine',
    location: 'Building A',
    isHrAdmin: false,
    isDirector: true,
  },
  systemInfo: {
    version: '2.0.0',
    environment: 'production',
  },
}

const mockConnectionConfig: ConnectionConfig = {
  apiUrl: 'https://bms.hospital.com',
  bearerToken: 'bearer-token-abc',
  databaseType: 'mysql',
  appIdentifier: 'BMS.Dashboard.NCD',
}

function makeMockHookReturn(
  overrides: Partial<ReturnType<typeof useBmsSession>> = {}
): ReturnType<typeof useBmsSession> {
  return {
    session: null as Session | null,
    sessionState: 'idle' as SessionState,
    connectionConfig: null as ConnectionConfig | null,
    error: null as Error | null,
    connectSession: vi.fn().mockResolvedValue(true),
    disconnectSession: vi.fn(),
    setDisconnected: vi.fn(),
    refreshSession: vi.fn().mockResolvedValue(true),
    executeQuery: vi.fn() as unknown as (sql: string) => Promise<SqlApiResponse>,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BmsSessionProvider / useBmsSessionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: no URL session, no cookie session
    vi.mocked(handleUrlSession).mockReturnValue(null)
    vi.mocked(getSessionCookie).mockReturnValue(null)
  })

  it('MUST provide session context to children', async () => {
    const mockHook = makeMockHookReturn({
      sessionState: 'connected',
      session: mockSession,
      connectionConfig: mockConnectionConfig,
    })
    vi.mocked(useBmsSession).mockReturnValue(mockHook)

    function Consumer() {
      const context = useBmsSessionContext()
      return (
        <div data-testid="consumer" data-session={JSON.stringify(context.session)}>
          {context.sessionState}
        </div>
      )
    }

    render(
      <BmsSessionProvider>
        <Consumer />
      </BmsSessionProvider>
    )

    await waitFor(() => expect(screen.getByTestId('consumer')).toBeInTheDocument())

    const consumer = screen.getByTestId('consumer')
    expect(consumer).toHaveTextContent('connected')
    expect(JSON.parse(consumer.getAttribute('data-session') ?? 'null')).toEqual(JSON.parse(JSON.stringify(mockSession)))
  })

  it('MUST throw error when useBmsSessionContext is used outside provider', () => {
    // Suppress React's console.error for this expected throw
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    function ConsumerOutsideProvider() {
      useBmsSessionContext()
      return <div>should not render</div>
    }

    expect(() => render(<ConsumerOutsideProvider />)).toThrow(
      'useBmsSessionContext must be used within a BmsSessionProvider'
    )

    consoleError.mockRestore()
  })

  it('MUST auto-connect when URL session param exists', async () => {
    const connectSession = vi.fn().mockResolvedValue(true)
    const mockHook = makeMockHookReturn({ connectSession })
    vi.mocked(useBmsSession).mockReturnValue(mockHook)
    vi.mocked(handleUrlSession).mockReturnValue('url-session-id-123')

    render(
      <BmsSessionProvider>
        <div data-testid="child">content</div>
      </BmsSessionProvider>
    )

    await waitFor(() => {
      expect(connectSession).toHaveBeenCalledWith('url-session-id-123', undefined)
    })
  })

  it('MUST auto-connect when cookie session exists', async () => {
    const connectSession = vi.fn().mockResolvedValue(true)
    const mockHook = makeMockHookReturn({ connectSession })
    vi.mocked(useBmsSession).mockReturnValue(mockHook)

    // No URL session, but cookie session present
    vi.mocked(handleUrlSession).mockReturnValue(null)
    vi.mocked(getSessionCookie).mockReturnValue('cookie-session-id-456')

    render(
      <BmsSessionProvider>
        <div data-testid="child">content</div>
      </BmsSessionProvider>
    )

    await waitFor(() => {
      expect(connectSession).toHaveBeenCalledWith('cookie-session-id-456', undefined)
    })
  })

  it('MUST prefer URL session over cookie session when both exist', async () => {
    const connectSession = vi.fn().mockResolvedValue(true)
    const mockHook = makeMockHookReturn({ connectSession })
    vi.mocked(useBmsSession).mockReturnValue(mockHook)

    vi.mocked(handleUrlSession).mockReturnValue('url-session-id')
    vi.mocked(getSessionCookie).mockReturnValue('cookie-session-id')

    render(
      <BmsSessionProvider>
        <div data-testid="child">content</div>
      </BmsSessionProvider>
    )

    await waitFor(() => {
      expect(connectSession).toHaveBeenCalledTimes(1)
      expect(connectSession).toHaveBeenCalledWith('url-session-id', undefined)
    })
  })

  it('MUST call setDisconnected when no session is found', async () => {
    const setDisconnected = vi.fn()
    const mockHook = makeMockHookReturn({ setDisconnected })
    vi.mocked(useBmsSession).mockReturnValue(mockHook)

    vi.mocked(handleUrlSession).mockReturnValue(null)
    vi.mocked(getSessionCookie).mockReturnValue(null)

    render(
      <BmsSessionProvider>
        <div data-testid="child">content</div>
      </BmsSessionProvider>
    )

    await waitFor(() => {
      expect(setDisconnected).toHaveBeenCalled()
    })
  })

  it('MUST not call connectSession when no session source is available', async () => {
    const connectSession = vi.fn().mockResolvedValue(true)
    const mockHook = makeMockHookReturn({ connectSession })
    vi.mocked(useBmsSession).mockReturnValue(mockHook)

    vi.mocked(handleUrlSession).mockReturnValue(null)
    vi.mocked(getSessionCookie).mockReturnValue(null)

    render(
      <BmsSessionProvider>
        <div data-testid="child">content</div>
      </BmsSessionProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    expect(connectSession).not.toHaveBeenCalled()
  })

  it('MUST render children inside provider', async () => {
    const mockHook = makeMockHookReturn()
    vi.mocked(useBmsSession).mockReturnValue(mockHook)

    render(
      <BmsSessionProvider>
        <div data-testid="wrapped-child">Dashboard</div>
      </BmsSessionProvider>
    )

    expect(screen.getByTestId('wrapped-child')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
