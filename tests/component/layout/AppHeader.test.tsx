// tests/component/layout/AppHeader.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import { AppHeader } from '@/components/layout/AppHeader'
import type { Session, ConnectionConfig, SqlApiResponse } from '@/types'

// Mock the useBmsSessionContext hook
vi.mock('@/contexts/BmsSessionContext', () => ({
  useBmsSessionContext: vi.fn(),
}))

import { useBmsSessionContext } from '@/contexts/BmsSessionContext'

const mockSession: Session = {
  sessionId: 'test-session-id',
  apiUrl: 'https://test.api.com',
  bearerToken: 'test-token',
  databaseType: 'postgresql',
  databaseName: 'test_db',
  expirySeconds: 36000,
  connectedAt: new Date(),
  userInfo: {
    name: 'Dr. สมชาย ทดสอบ',
    position: 'แพทย์',
    positionId: 1,
    hospitalCode: 'H001',
    doctorCode: 'D001',
    department: 'OB-GYN',
    location: 'โรงพยาบาลทดสอบ',
    isHrAdmin: false,
    isDirector: false,
  },
  systemInfo: {
    version: '1.0.0',
    environment: 'production',
  },
}

const mockConnectionConfig: ConnectionConfig = {
  apiUrl: 'https://test.api.com',
  bearerToken: 'test-token',
  databaseType: 'postgresql',
  appIdentifier: 'BMS.Dashboard.React',
}

const mockContextValue = (overrides: Partial<ReturnType<typeof useBmsSessionContext>> = {}) => ({
  session: mockSession,
  sessionState: 'connected' as const,
  connectionConfig: mockConnectionConfig,
  error: null as Error | null,
  connectSession: vi.fn(),
  disconnectSession: vi.fn(),
  setDisconnected: vi.fn(),
  refreshSession: vi.fn(),
  executeQuery: vi.fn() as unknown as (sql: string) => Promise<SqlApiResponse>,
  ...overrides,
})

describe('AppHeader', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Branding', () => {
    it('MUST render app title', () => {
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue())

      render(<AppHeader />, { wrapper: BrowserRouter })

      expect(screen.getByText('ระบบฝากครรภ์และการคลอด')).toBeInTheDocument()
    })

    it('MUST render BMS Session subtitle', () => {
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue())

      render(<AppHeader />, { wrapper: BrowserRouter })

      expect(screen.getByText('Pregnancy & Labor Dashboard')).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    it('MUST render navigation link to home', () => {
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue())

      render(<AppHeader />, { wrapper: BrowserRouter })

      const homeLink = screen.getByRole('link', { name: /หน้าหลัก/ })
      expect(homeLink).toBeInTheDocument()
      expect(homeLink).toHaveAttribute('href', '/')
    })
  })

  describe('Connection Status', () => {
    it('MUST show connected status when session is active', () => {
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue())

      render(<AppHeader />, { wrapper: BrowserRouter })

      expect(screen.getByText('เชื่อมต่อแล้ว')).toBeInTheDocument()
    })

    it('MUST show database type badge', () => {
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue())

      render(<AppHeader />, { wrapper: BrowserRouter })

      expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
    })
  })

  describe('User Info', () => {
    it('MUST show user name from session', () => {
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue())

      render(<AppHeader />, { wrapper: BrowserRouter })

      expect(screen.getByText('Dr. สมชาย ทดสอบ')).toBeInTheDocument()
    })

    it('MUST show user department', () => {
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue())

      render(<AppHeader />, { wrapper: BrowserRouter })

      expect(screen.getByText('OB-GYN')).toBeInTheDocument()
    })
  })

  describe('Logout', () => {
    it('MUST render logout button', () => {
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue())

      render(<AppHeader />, { wrapper: BrowserRouter })

      expect(screen.getByRole('button', { name: 'ออกจากระบบ' })).toBeInTheDocument()
    })

    it('MUST call disconnectSession when logout is clicked', async () => {
      const user = userEvent.setup()
      const disconnectSession = vi.fn()
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue({ disconnectSession }))

      render(<AppHeader />, { wrapper: BrowserRouter })

      const logoutButton = screen.getByRole('button', { name: 'ออกจากระบบ' })
      await user.click(logoutButton)

      expect(disconnectSession).toHaveBeenCalledTimes(1)
    })
  })

  describe('MySQL Database Type', () => {
    it('MUST show MySQL badge for MySQL connections', () => {
      vi.mocked(useBmsSessionContext).mockReturnValue(mockContextValue({
        session: { ...mockSession, databaseType: 'mysql' },
        connectionConfig: { ...mockConnectionConfig, databaseType: 'mysql' },
      }))

      render(<AppHeader />, { wrapper: BrowserRouter })

      expect(screen.getByText('MySQL')).toBeInTheDocument()
    })
  })
})
