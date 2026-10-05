// tests/component/session/SessionValidator.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionValidator } from '@/components/session/SessionValidator'
import type { SessionState, ConnectionConfig, Session, SqlApiResponse } from '@/types'

// Mock the useBmsSessionContext hook
vi.mock('@/contexts/BmsSessionContext', () => ({
  useBmsSessionContext: vi.fn(),
}))

import { useBmsSessionContext } from '@/contexts/BmsSessionContext'


const mockContextValue = (overrides: Partial<ReturnType<typeof useBmsSessionContext>> = {}) => ({
  session: null as Session | null,
  sessionState: 'disconnected' as SessionState,
  connectionConfig: null as ConnectionConfig | null,
  error: null as Error | null,
  connectSession: vi.fn(),
  disconnectSession: vi.fn(),
  setDisconnected: vi.fn(),
  refreshSession: vi.fn(),
  executeQuery: vi.fn() as unknown as (sql: string) => Promise<SqlApiResponse>,
  ...overrides,
})

describe('SessionValidator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Idle State', () => {
    it('MUST render nothing when session state is idle', () => {
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue({ sessionState: 'idle' }))

      const { container } = render(
        <SessionValidator>
          <div data-testid="children">Dashboard Content</div>
        </SessionValidator>
      )

      expect(container.firstChild).toBeNull()
      expect(screen.queryByTestId('children')).not.toBeInTheDocument()
    })
  })

  describe('Connecting State', () => {
    it('MUST show connecting screen when session state is connecting', () => {
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue({ sessionState: 'connecting' }))

      render(
        <SessionValidator>
          <div data-testid="children">Dashboard Content</div>
        </SessionValidator>
      )

      expect(screen.getByText('กำลังเชื่อมต่อ')).toBeInTheDocument()
      expect(screen.getByText('ยืนยันตัวตนกับ BMS Session API...')).toBeInTheDocument()
    })

    it('MUST announce the connecting progress as a status', () => {
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue({ sessionState: 'connecting' }))

      render(
        <SessionValidator>
          <div data-testid="children">Dashboard Content</div>
        </SessionValidator>
      )

      expect(screen.getByRole('status')).toHaveTextContent('กำลังเชื่อมต่อ')
    })
  })

  describe('Disconnected State', () => {
    it('MUST show login form when session state is disconnected', () => {
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue({ sessionState: 'disconnected' }))

      render(
        <SessionValidator>
          <div data-testid="children">Dashboard Content</div>
        </SessionValidator>
      )

      expect(screen.getByText('เชื่อมต่อเซสชัน')).toBeInTheDocument()
      expect(screen.getByLabelText('รหัสเซสชัน BMS')).toBeInTheDocument()
    })

    it('MUST show error in login form when error is provided', () => {
      const error = new Error('Connection failed')
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue({
        sessionState: 'disconnected',
        error,
      }))

      render(
        <SessionValidator>
          <div data-testid="children">Dashboard Content</div>
        </SessionValidator>
      )

      expect(screen.getByText('Connection failed')).toBeInTheDocument()
    })
  })

  describe('Expired State', () => {
    it('MUST show session expired screen when session state is expired', () => {
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue({ sessionState: 'expired' }))

      render(
        <SessionValidator>
          <div data-testid="children">Dashboard Content</div>
        </SessionValidator>
      )

      expect(screen.getByText('เซสชันหมดอายุ')).toBeInTheDocument()
      expect(screen.getByText(/เซสชัน BMS ของคุณหมดอายุแล้ว/)).toBeInTheDocument()
    })

    it('MUST show error in expired screen when error is provided', () => {
      const error = new Error('Session timeout')
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue({
        sessionState: 'expired',
        error,
      }))

      render(
        <SessionValidator>
          <div data-testid="children">Dashboard Content</div>
        </SessionValidator>
      )

      expect(screen.getByText('Session timeout')).toBeInTheDocument()
    })
  })

  describe('Connected State', () => {
    it('MUST render children when session state is connected', () => {
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue({ sessionState: 'connected' }))

      render(
        <SessionValidator>
          <div data-testid="children">Dashboard Content</div>
        </SessionValidator>
      )

      expect(screen.getByTestId('children')).toBeInTheDocument()
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
    })

    it('MUST not show login form when connected', () => {
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue({ sessionState: 'connected' }))

      render(
        <SessionValidator>
          <div data-testid="children">Dashboard Content</div>
        </SessionValidator>
      )

      expect(screen.queryByLabelText('รหัสเซสชัน BMS')).not.toBeInTheDocument()
    })

    it('MUST not show connecting screen when connected', () => {
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue({ sessionState: 'connected' }))

      render(
        <SessionValidator>
          <div data-testid="children">Dashboard Content</div>
        </SessionValidator>
      )

      expect(screen.queryByText('กำลังเชื่อมต่อ')).not.toBeInTheDocument()
    })
  })
})
