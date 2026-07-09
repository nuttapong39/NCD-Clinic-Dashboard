// tests/component/ui/StatusBadge.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/ui/StatusBadge'

describe('StatusBadge', () => {
  it('MUST show positive styling for positive values', () => {
    render(<StatusBadge value="ทันเวลา" />)
    const badge = screen.getByText('ทันเวลา')
    expect(badge.className).toContain('bg-emerald-100')
    expect(badge.className).toContain('text-emerald-700')
  })

  it('MUST show negative styling for negative values', () => {
    render(<StatusBadge value="ช้ากว่ากำหนด" />)
    const badge = screen.getByText('ช้ากว่ากำหนด')
    expect(badge.className).toContain('bg-red-100')
    expect(badge.className).toContain('text-red-700')
  })

  it('MUST show neutral styling for other values', () => {
    render(<StatusBadge value="รอดำเนินการ" />)
    const badge = screen.getByText('รอดำเนินการ')
    expect(badge.className).toContain('bg-slate-100')
    expect(badge.className).toContain('text-slate-600')
  })

  it('MUST support custom positive value lists', () => {
    render(<StatusBadge value="approved" positiveValues={['approved']} />)
    const badge = screen.getByText('approved')
    expect(badge.className).toContain('bg-emerald-100')
    expect(badge.className).toContain('text-emerald-700')
  })

  it('MUST support custom negative value lists', () => {
    render(<StatusBadge value="rejected" negativeValues={['rejected']} />)
    const badge = screen.getByText('rejected')
    expect(badge.className).toContain('bg-red-100')
    expect(badge.className).toContain('text-red-700')
  })
})
