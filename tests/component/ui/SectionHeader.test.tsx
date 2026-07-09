// tests/component/ui/SectionHeader.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SectionHeader } from '@/components/ui/SectionHeader'

describe('SectionHeader', () => {
  it('MUST render title and subtitle', () => {
    render(
      <SectionHeader
        title="Recent Deliveries"
        subtitle="Labor Records"
        accent="from-rose-400 to-pink-600"
      />
    )
    expect(screen.getByText('Recent Deliveries')).toBeInTheDocument()
    expect(screen.getByText('Labor Records')).toBeInTheDocument()
  })

  it('MUST apply accent gradient class', () => {
    const accent = 'from-blue-400 to-indigo-600'
    render(
      <SectionHeader
        title="Section Title"
        subtitle="Section Subtitle"
        accent={accent}
      />
    )
    const accentBar = document.querySelector('.bg-gradient-to-b')
    expect(accentBar).toBeInTheDocument()
    expect(accentBar?.className).toContain('from-blue-400')
    expect(accentBar?.className).toContain('to-indigo-600')
  })
})
