// tests/component/pregnancy/KpiCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiCard } from '@/components/pregnancy/KpiCard'

describe('KpiCard', () => {
  it('MUST render title and value correctly', () => {
    render(
      <KpiCard
        title="ตั้งครรภ์ปัจจุบัน"
        value={42}
        icon="Baby"
        color="rose"
        format="number"
      />
    )

    expect(screen.getByText('ตั้งครรภ์ปัจจุบัน')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('MUST format percentage values correctly', () => {
    render(
      <KpiCard
        title="อัตรา C-Section"
        value={25.5}
        icon="Activity"
        color="purple"
        format="percentage"
      />
    )

    expect(screen.getByText('25.5%')).toBeInTheDocument()
  })

  it('MUST show loading skeleton when loading prop is true', () => {
    render(
      <KpiCard
        title="ตั้งครรภ์ปัจจุบัน"
        value={null}
        icon="Baby"
        color="rose"
        format="number"
        loading
      />
    )

    // Should not show N/A when loading
    expect(screen.queryByText('N/A')).not.toBeInTheDocument()
    // Should have skeleton element
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('MUST show N/A when value is null and not loading', () => {
    render(
      <KpiCard
        title="ตั้งครรภ์ปัจจุบัน"
        value={null}
        icon="Baby"
        color="rose"
        format="number"
      />
    )

    expect(screen.getByText('N/A')).toBeInTheDocument()
  })

  it('MUST format large numbers with Thai locale (e.g., 1234 → "1,234")', () => {
    render(
      <KpiCard
        title="ผู้ป่วยรวม"
        value={1234}
        icon="Activity"
        color="blue"
        format="number"
      />
    )

    expect(screen.getByText('1,234')).toBeInTheDocument()
  })

  it('MUST handle zero value correctly (shows "0", not "N/A")', () => {
    render(
      <KpiCard
        title="ตั้งครรภ์ปัจจุบัน"
        value={0}
        icon="Baby"
        color="rose"
        format="number"
      />
    )

    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.queryByText('N/A')).not.toBeInTheDocument()
  })

  it('MUST fall back to default icon when invalid icon name is provided', () => {
    render(
      <KpiCard
        title="ทดสอบ"
        value={42}
        icon="InvalidIconName"
        color="rose"
        format="number"
      />
    )

    // Should still render the card (fallback to Baby icon)
    expect(screen.getByText('ทดสอบ')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    // Icon should still be present in the document
    const iconContainer = document.querySelector('svg')
    expect(iconContainer).toBeInTheDocument()
  })

  it('MUST fall back to default color when invalid color is provided', () => {
    render(
      <KpiCard
        title="ทดสอบ"
        value={42}
        icon="Baby"
        color={'invalid-color' as any}
        format="number"
      />
    )

    // Should still render the card (fallback to blue color)
    expect(screen.getByText('ทดสอบ')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    // Card container should exist
    const cardContainer = document.querySelector('.rounded-xl')
    expect(cardContainer).toBeInTheDocument()
  })
})
