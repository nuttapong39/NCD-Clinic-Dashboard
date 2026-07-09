// tests/component/ui/ChartWrapper.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChartWrapper } from '@/components/ui/ChartWrapper'

describe('ChartWrapper', () => {
  it('MUST show loading skeleton when loading is true', () => {
    render(
      <ChartWrapper title="Test Chart" loading={true}>
        <div>chart content</div>
      </ChartWrapper>
    )
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
    expect(screen.queryByText('chart content')).not.toBeInTheDocument()
  })

  it('MUST show empty message when isEmpty is true', () => {
    render(
      <ChartWrapper title="Test Chart" isEmpty={true}>
        <div>chart content</div>
      </ChartWrapper>
    )
    expect(screen.getByText(/ไม่มีข้อมูลในช่วงเวลานี้/)).toBeInTheDocument()
    expect(screen.queryByText('chart content')).not.toBeInTheDocument()
  })

  it('MUST show custom empty message when provided', () => {
    render(
      <ChartWrapper title="Test Chart" isEmpty={true} emptyMessage="No data available">
        <div>chart content</div>
      </ChartWrapper>
    )
    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('MUST render children when not loading and not empty', () => {
    render(
      <ChartWrapper title="Test Chart">
        <div>chart content</div>
      </ChartWrapper>
    )
    expect(screen.getByText('chart content')).toBeInTheDocument()
    expect(document.querySelector('.animate-pulse')).not.toBeInTheDocument()
  })
})
