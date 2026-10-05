// tests/component/session/LoginForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '@/components/session/LoginForm'

describe('LoginForm', () => {
  const mockOnConnect = vi.fn()

  beforeEach(() => {
    mockOnConnect.mockClear()
  })

  describe('Rendering', () => {
    it('MUST render the login form with all required elements', () => {
      render(<LoginForm onConnect={mockOnConnect} error={null} isConnecting={false} />)

      // Header elements
      expect(screen.getByText('เชื่อมต่อเซสชัน')).toBeInTheDocument()
      expect(screen.getByText('ป้อนรหัสเซสชัน BMS เพื่อเริ่มใช้งาน')).toBeInTheDocument()

      // Form elements
      expect(screen.getByLabelText('รหัสเซสชัน BMS')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'เชื่อมต่อ' })).toBeInTheDocument()

      // Help link
      expect(screen.getByText('ติดต่อฝ่ายสนับสนุน')).toBeInTheDocument()
    })

    it('MUST render branding section with features', () => {
      render(<LoginForm onConnect={mockOnConnect} error={null} isConnecting={false} />)

      expect(screen.getByText('คลินิกเบาหวาน · ความดัน')).toBeInTheDocument()
      expect(screen.getByText('NCD Clinic Dashboard')).toBeInTheDocument()
      expect(screen.getByText('เชื่อมต่อ HOSxP')).toBeInTheDocument()
      expect(screen.getByText('แนวโน้มรายปีงบประมาณ')).toBeInTheDocument()
      expect(screen.getByText('ปลอดภัยด้วย BMS Session')).toBeInTheDocument()
    })

    it('MUST render input with placeholder text', () => {
      render(<LoginForm onConnect={mockOnConnect} error={null} isConnecting={false} />)

      const input = screen.getByPlaceholderText('02FA45D1-91EF-4D6E-B341-ED1436343807')
      expect(input).toBeInTheDocument()
    })
  })

  describe('Form Interaction', () => {
    it('MUST allow typing in the session ID input', async () => {
      const user = userEvent.setup()
      render(<LoginForm onConnect={mockOnConnect} error={null} isConnecting={false} />)

      const input = screen.getByLabelText('รหัสเซสชัน BMS')
      // Clear the input first (it may have a default value from env)
      await user.clear(input)
      await user.type(input, 'TEST-SESSION-ID')

      expect(input).toHaveValue('TEST-SESSION-ID')
    })

    it('MUST submit form when connect button is clicked', async () => {
      const user = userEvent.setup()
      mockOnConnect.mockResolvedValue(true)
      render(<LoginForm onConnect={mockOnConnect} error={null} isConnecting={false} />)

      const input = screen.getByLabelText('รหัสเซสชัน BMS')
      await user.clear(input)
      await user.type(input, 'TEST-SESSION-ID')

      const button = screen.getByRole('button', { name: 'เชื่อมต่อ' })
      await user.click(button)

      expect(mockOnConnect).toHaveBeenCalledWith('TEST-SESSION-ID')
    })

    it('MUST not submit when input is empty', async () => {
      const user = userEvent.setup()
      render(<LoginForm onConnect={mockOnConnect} error={null} isConnecting={false} />)

      const input = screen.getByLabelText('รหัสเซสชัน BMS')
      await user.clear(input)

      const button = screen.getByRole('button', { name: 'เชื่อมต่อ' })
      expect(button).toBeDisabled()

      await user.click(button)

      expect(mockOnConnect).not.toHaveBeenCalled()
    })

    it('MUST trim whitespace from session ID before submitting', async () => {
      const user = userEvent.setup()
      mockOnConnect.mockResolvedValue(true)
      render(<LoginForm onConnect={mockOnConnect} error={null} isConnecting={false} />)

      const input = screen.getByLabelText('รหัสเซสชัน BMS')
      await user.clear(input)
      await user.type(input, '  TEST-SESSION-ID  ')

      const button = screen.getByRole('button', { name: 'เชื่อมต่อ' })
      await user.click(button)

      expect(mockOnConnect).toHaveBeenCalledWith('TEST-SESSION-ID')
    })
  })

  describe('Loading State', () => {
    it('MUST show loading state when isConnecting is true', () => {
      render(<LoginForm onConnect={mockOnConnect} error={null} isConnecting={true} />)

      expect(screen.getByText('กำลังเชื่อมต่อ...')).toBeInTheDocument()

      const input = screen.getByLabelText('รหัสเซสชัน BMS')
      expect(input).toBeDisabled()
    })

    it('MUST disable button during connection', () => {
      render(<LoginForm onConnect={mockOnConnect} error={null} isConnecting={true} />)

      const button = screen.getByRole('button', { name: /กำลังเชื่อมต่อ/ })
      expect(button).toBeDisabled()
    })
  })

  describe('Error Display', () => {
    it('MUST display error message when error prop is provided', () => {
      const error = new Error('Invalid session ID')
      render(<LoginForm onConnect={mockOnConnect} error={error} isConnecting={false} />)

      expect(screen.getByText('การเชื่อมต่อล้มเหลว')).toBeInTheDocument()
      expect(screen.getByText('เชื่อมต่อเซสชันไม่สำเร็จ กรุณาตรวจสอบรหัสเซสชันแล้วลองใหม่')).toBeInTheDocument()
    })

    it('MUST display rate limit error with retry info', () => {
      const error = new Error('มีการร้องขอบ่อยเกินไป (HTTP 429). กรุณารอ 30 วินาทีแล้วลองใหม่')
      render(<LoginForm onConnect={mockOnConnect} error={error} isConnecting={false} />)

      expect(screen.getByText(/มีการร้องขอบ่อยเกินไป/)).toBeInTheDocument()
    })

    it('MUST not display error section when error is null', () => {
      render(<LoginForm onConnect={mockOnConnect} error={null} isConnecting={false} />)

      expect(screen.queryByText('การเชื่อมต่อล้มเหลว')).not.toBeInTheDocument()
    })
  })

  describe('Form Submission', () => {
    it('MUST submit form on Enter key press', async () => {
      const user = userEvent.setup()
      mockOnConnect.mockResolvedValue(true)
      render(<LoginForm onConnect={mockOnConnect} error={null} isConnecting={false} />)

      const input = screen.getByLabelText('รหัสเซสชัน BMS')
      await user.clear(input)
      await user.type(input, 'TEST-SESSION-ID{enter}')

      expect(mockOnConnect).toHaveBeenCalledWith('TEST-SESSION-ID')
    })
  })
})
