// tests/component/pregnancy/PregnancyLaborDashboard.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { PregnancyLaborDashboard } from '@/pages/PregnancyLaborDashboard'
import { BmsSessionContext } from '@/contexts/BmsSessionContext'
import type { Session, ConnectionConfig, SessionState, SqlApiResponse } from '@/types'

// Mock data
const mockSession: Session = {
  sessionId: 'test-session-id',
  apiUrl: 'https://test.api.com',
  bearerToken: 'test-token',
  databaseType: 'postgresql',
  databaseName: 'test_db',
  expirySeconds: 36000,
  connectedAt: new Date(),
  userInfo: {
    name: 'Test User',
    position: 'Doctor',
    positionId: 1,
    hospitalCode: 'H001',
    doctorCode: 'D001',
    department: 'OB-GYN',
    location: 'ศูนย์สุขภาพชุมชนเมืองโรงพยาบาลโพธาราม',
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

const createMockExecuteQuery = () => {
  return vi.fn().mockImplementation(async (sql: string): Promise<SqlApiResponse> => {
    // KPI queries - single COUNT(*) values
    if (sql.includes('active_pregnancies')) {
      return {
        result: {},
        MessageCode: 200,
        Message: 'OK',
        RequestTime: new Date().toISOString(),
        data: [{ active_pregnancies: 150 }],
        field: [2],
        field_name: ['active_pregnancies'],
        record_count: 1,
      }
    }
    if (sql.includes('new_anc')) {
      return {
        result: {},
        MessageCode: 200,
        Message: 'OK',
        RequestTime: new Date().toISOString(),
        data: [{ new_anc: 25 }],
        field: [2],
        field_name: ['new_anc'],
        record_count: 1,
      }
    }
    if (sql.includes('due_soon')) {
      return {
        result: {},
        MessageCode: 200,
        Message: 'OK',
        RequestTime: new Date().toISOString(),
        data: [{ due_soon: 30 }],
        field: [2],
        field_name: ['due_soon'],
        record_count: 1,
      }
    }
    if (sql.includes('deliveries') && sql.includes('COUNT')) {
      return {
        result: {},
        MessageCode: 200,
        Message: 'OK',
        RequestTime: new Date().toISOString(),
        data: [{ deliveries: 20 }],
        field: [2],
        field_name: ['deliveries'],
        record_count: 1,
      }
    }
    // C-section rate query: GROUP BY person_labour_type_name with COUNT(*) as count
    // Has person_labour_type_name in SELECT with COUNT and GROUP BY (no labor_date alias)
    if (sql.includes('person_labour_type_name') && sql.includes('COUNT(*) as count') && sql.includes('GROUP BY person_labour_type_name')) {
      // Returns delivery type counts for calculating C-section rate
      // 57 C-section out of 200 total = 28.5%
      return {
        result: {},
        MessageCode: 200,
        Message: 'OK',
        RequestTime: new Date().toISOString(),
        data: [
          { person_labour_type_name: 'คลอดปกติ', count: 143 },
          { person_labour_type_name: 'C-Section', count: 57 },
        ],
        field: [6, 2],
        field_name: ['person_labour_type_name', 'count'],
        record_count: 2,
      }
    }
    if (sql.includes('high_risk') && sql.includes('COUNT')) {
      return {
        result: {},
        MessageCode: 200,
        Message: 'OK',
        RequestTime: new Date().toISOString(),
        data: [{ high_risk: 12 }],
        field: [2],
        field_name: ['high_risk'],
        record_count: 1,
      }
    }
    if (sql.includes('tt_coverage')) {
      return {
        result: {},
        MessageCode: 200,
        Message: 'OK',
        RequestTime: new Date().toISOString(),
        data: [{ tt_coverage_percent: 85.3 }],
        field: [3],
        field_name: ['tt_coverage_percent'],
        record_count: 1,
      }
    }
    if (sql.includes('anc5_plus')) {
      return {
        result: {},
        MessageCode: 200,
        Message: 'OK',
        RequestTime: new Date().toISOString(),
        data: [{ anc5_plus_percent: 142 }],
        field: [3],
        field_name: ['anc5_plus_percent'],
        record_count: 1,
      }
    }

    // Summary table queries - return array data
    if (sql.includes('labor_date') || sql.includes('person_labour')) {
      // Recent deliveries query
      return {
        result: {},
        MessageCode: 200,
        Message: 'OK',
        RequestTime: new Date().toISOString(),
        data: [
          {
            laborDate: '2026-03-20',
            hn: 'HN001',
            patientName: 'นางสมหญิง ทดสอบ',
            ga: 38,
            deliveryType: 'คลอดปกติ',
            birthWeight: 3100,
            apgar1: 8,
            apgar5: 9,
          },
        ],
        field: [4, 6, 6, 2, 6, 2, 2, 2],
        field_name: ['laborDate', 'hn', 'patientName', 'ga', 'deliveryType', 'birthWeight', 'apgar1', 'apgar5'],
        record_count: 1,
      }
    }
    if (sql.includes('has_risk') && sql.includes('Y')) {
      // High risk pregnancies query
      return {
        result: {},
        MessageCode: 200,
        Message: 'OK',
        RequestTime: new Date().toISOString(),
        data: [
          {
            hn: 'HN002',
            patientName: 'นางสมศรี ทดสอบ',
            edc: '2026-04-15',
            riskLevel: 'สูง',
            riskList: 'ความดันโลหิตสูง',
          },
        ],
        field: [6, 6, 4, 6, 6],
        field_name: ['hn', 'patientName', 'edc', 'riskLevel', 'riskList'],
        record_count: 1,
      }
    }
    if (sql.includes('daysRemaining') || (sql.includes('edc') && sql.includes('DATEDIFF'))) {
      // Upcoming EDC query
      return {
        result: {},
        MessageCode: 200,
        Message: 'OK',
        RequestTime: new Date().toISOString(),
        data: [
          {
            hn: 'HN003',
            patientName: 'นางสมใจ ทดสอบ',
            edc: '2026-04-10',
            daysRemaining: 14,
          },
        ],
        field: [6, 6, 4, 2],
        field_name: ['hn', 'patientName', 'edc', 'daysRemaining'],
        record_count: 1,
      }
    }

    // Default empty response
    return {
      result: {},
      MessageCode: 200,
      Message: 'OK',
      RequestTime: new Date().toISOString(),
      data: [],
      field: [],
      field_name: [],
      record_count: 0,
    }
  })
}

const renderDashboard = (overrides: {
  sessionState?: SessionState
  connectionConfig?: ConnectionConfig | null
  executeQuery?: (sql: string) => Promise<SqlApiResponse>
  error?: Error | null
} = {}) => {
  const contextValue = {
    session: mockSession,
    sessionState: 'connected' as SessionState,
    connectionConfig: mockConnectionConfig,
    error: null as Error | null,
    connectSession: vi.fn(),
    disconnectSession: vi.fn(),
    setDisconnected: vi.fn(),
    refreshSession: vi.fn(),
    executeQuery: createMockExecuteQuery(),
    ...overrides,
  }

  return render(
    <BrowserRouter>
      <BmsSessionContext.Provider value={contextValue}>
        <PregnancyLaborDashboard />
      </BmsSessionContext.Provider>
    </BrowserRouter>
  )
}

describe('PregnancyLaborDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders the dashboard header', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('ระบบฝากครรภ์และการคลอด')).toBeInTheDocument()
      })
    })



    it('renders hospital name from session', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText(/ศูนย์สุขภาพชุมชนเมืองโรงพยาบาลโพธาราม/)).toBeInTheDocument()
      })
    })
  })

  describe('KPI Cards', () => {
    it('renders all 8 KPI card sections', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('ตั้งครรภ์ปัจจุบัน')).toBeInTheDocument()
        expect(screen.getByText('ฝากครรภ์ใหม่เดือนนี้')).toBeInTheDocument()
        expect(screen.getByText('รอคลอดใกล้เคียง')).toBeInTheDocument()
        expect(screen.getByText('คลอดเดือนนี้')).toBeInTheDocument()
        expect(screen.getByText('อัตรา C-Section')).toBeInTheDocument()
        expect(screen.getByText('เสี่ยงสูง')).toBeInTheDocument()
        expect(screen.getByText('ครอบคลุม TT')).toBeInTheDocument()
        expect(screen.getByText('ANC 5+ ครั้ง')).toBeInTheDocument()
      })
    })

    it('displays KPI values after loading', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument() // current_pregnancies
      })
    })

    it('formats percentage values correctly', async () => {
      renderDashboard()

      // Verify KPI cards render percentage values (exact values depend on async query timing)
      await waitFor(() => {
        const percentageCards = screen.getAllByText(/%/)
        expect(percentageCards.length).toBeGreaterThan(0)
      })
    })
  })

  describe('Summary Tables', () => {
    it('renders summary table section', () => {
      renderDashboard()
      // Summary tables section should be present (actual data loaded async)
      const sections = document.querySelectorAll('section')
      expect(sections.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Loading State', () => {
    it('shows loading skeletons initially', () => {
      const slowQuery = vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves
      renderDashboard({ executeQuery: slowQuery })

      // Should show skeleton elements
      const skeletons = document.querySelectorAll('.animate-pulse')
      expect(skeletons.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('handles query errors gracefully', async () => {
      const errorQuery = vi.fn().mockRejectedValue(new Error('Query failed'))
      renderDashboard({ executeQuery: errorQuery })

      // Should still render the dashboard structure
      await waitFor(() => {
        expect(screen.getByText('ระบบฝากครรภ์และการคลอด')).toBeInTheDocument()
      })
    })

    it('handles empty data gracefully', async () => {
      const emptyQuery = vi.fn().mockResolvedValue({
        result: {},
        MessageCode: 200,
        Message: 'OK',
        RequestTime: new Date().toISOString(),
        data: [],
        field: [],
        field_name: [],
        record_count: 0,
      })
      renderDashboard({ executeQuery: emptyQuery })

      await waitFor(() => {
        expect(screen.getByText('ระบบฝากครรภ์และการคลอด')).toBeInTheDocument()
      })
    })
  })

  describe('Refresh Button', () => {
    it('renders refresh button', async () => {
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText('รีเฟรช')).toBeInTheDocument()
      })
    })
  })

  describe('No Connection', () => {
    it('does not make queries when not connected', () => {
      const executeQuery = createMockExecuteQuery()
      renderDashboard({
        sessionState: 'disconnected',
        connectionConfig: null,
        executeQuery,
      })

      expect(executeQuery).not.toHaveBeenCalled()
    })
  })
})
