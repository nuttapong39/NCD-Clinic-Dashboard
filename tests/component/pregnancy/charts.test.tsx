// tests/component/pregnancy/charts.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DeliveryTrendChart } from '@/components/pregnancy/DeliveryTrendChart'
import { GaDistributionChart } from '@/components/pregnancy/GaDistributionChart'
import { AncComplianceChart } from '@/components/pregnancy/AncComplianceChart'
import { BirthWeightChart } from '@/components/pregnancy/BirthWeightChart'
import { ApgarScoreChart } from '@/components/pregnancy/ApgarScoreChart'
import { DeliveryTypeChart } from '@/components/pregnancy/DeliveryTypeChart'
import type {
  DeliveryTrendData,
  GaDistributionData,
  AncComplianceData,
  BirthWeightData,
  ApgarScoreData,
  DeliveryTypeData,
} from '@/types/pregnancy'

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const deliveryTrendData: DeliveryTrendData[] = [
  { month: 'ม.ค.', deliveries: 12 },
  { month: 'ก.พ.', deliveries: 15 },
]

const gaDistributionData: GaDistributionData[] = [
  { category: 'Term (37w+)', count: 30 },
  { category: '3rd Trimester (28-36w)', count: 5 },
]

const ancComplianceData: AncComplianceData[] = [
  { visitCount: 3, patientCount: 10 },
  { visitCount: 5, patientCount: 20 },
]

const birthWeightData: BirthWeightData[] = [
  { category: 'Normal (2500-4000g)', count: 25 },
  { category: 'Low (<2500g)', count: 3 },
]

const apgarScoreData: ApgarScoreData[] = [
  { scoreRange: '7-10', oneMin: 40, fiveMin: 45 },
  { scoreRange: '4-6', oneMin: 5, fiveMin: 3 },
]

const deliveryTypeData: DeliveryTypeData[] = [
  { type: 'Normal', count: 30, percentage: 75 },
  { type: 'C-Section', count: 10, percentage: 25 },
]

// ---------------------------------------------------------------------------
// DeliveryTrendChart
// ---------------------------------------------------------------------------

describe('DeliveryTrendChart', () => {
  it('MUST show loading skeleton when loading is true', () => {
    render(<DeliveryTrendChart data={[]} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('MUST show empty state message when data is empty array', () => {
    render(<DeliveryTrendChart data={[]} loading={false} />)
    expect(screen.getByText(/ไม่มีข้อมูล/)).toBeInTheDocument()
  })

  it('MUST render chart title when data is provided', () => {
    render(<DeliveryTrendChart data={deliveryTrendData} />)
    expect(screen.getByText('แนวโน้มการคลอด')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// GaDistributionChart
// ---------------------------------------------------------------------------

describe('GaDistributionChart', () => {
  it('MUST show loading skeleton when loading is true', () => {
    render(<GaDistributionChart data={[]} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('MUST show empty state message when data is empty array', () => {
    render(<GaDistributionChart data={[]} loading={false} />)
    expect(screen.getByText(/ไม่มีข้อมูล/)).toBeInTheDocument()
  })

  it('MUST render chart title when data is provided', () => {
    render(<GaDistributionChart data={gaDistributionData} />)
    expect(screen.getByText('การกระจายตามอายุครรภ์')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// AncComplianceChart
// ---------------------------------------------------------------------------

describe('AncComplianceChart', () => {
  it('MUST show loading skeleton when loading is true', () => {
    render(<AncComplianceChart data={[]} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('MUST show empty state message when data is empty array', () => {
    render(<AncComplianceChart data={[]} loading={false} />)
    expect(screen.getByText(/ไม่มีข้อมูล/)).toBeInTheDocument()
  })

  it('MUST render chart title when data is provided', () => {
    render(<AncComplianceChart data={ancComplianceData} />)
    expect(screen.getByText('การมาฝากครรภ์ (ANC)')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// BirthWeightChart
// ---------------------------------------------------------------------------

describe('BirthWeightChart', () => {
  it('MUST show loading skeleton when loading is true', () => {
    render(<BirthWeightChart data={[]} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('MUST show empty state message when data is empty array', () => {
    render(<BirthWeightChart data={[]} loading={false} />)
    expect(screen.getByText(/ไม่มีข้อมูล/)).toBeInTheDocument()
  })

  it('MUST render chart title when data is provided', () => {
    render(<BirthWeightChart data={birthWeightData} />)
    expect(screen.getByText('การกระจายน้ำหนักแรกคลอด')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// ApgarScoreChart
// ---------------------------------------------------------------------------

describe('ApgarScoreChart', () => {
  it('MUST show loading skeleton when loading is true', () => {
    render(<ApgarScoreChart data={[]} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('MUST show empty state message when data is empty array', () => {
    render(<ApgarScoreChart data={[]} loading={false} />)
    expect(screen.getByText(/ไม่มีข้อมูล/)).toBeInTheDocument()
  })

  it('MUST render chart title when data is provided', () => {
    render(<ApgarScoreChart data={apgarScoreData} />)
    expect(screen.getByText('Apgar Score')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// DeliveryTypeChart
// ---------------------------------------------------------------------------

describe('DeliveryTypeChart', () => {
  it('MUST show loading skeleton when loading is true', () => {
    render(<DeliveryTypeChart data={[]} loading={true} />)
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('MUST show empty state message when data is empty array', () => {
    render(<DeliveryTypeChart data={[]} loading={false} />)
    expect(screen.getByText(/ไม่มีข้อมูล/)).toBeInTheDocument()
  })

  it('MUST render chart title when data is provided', () => {
    render(<DeliveryTypeChart data={deliveryTypeData} />)
    expect(screen.getByText('ประเภทการคลอด')).toBeInTheDocument()
  })
})
