// =============================================================================
// Pregnancy & Labor Dashboard - Type Definitions (T019)
// =============================================================================

// ---------------------------------------------------------------------------
// KPI Data Types
// ---------------------------------------------------------------------------

export interface PregnancyKpis {
  activePregnancies: number
  newAncThisMonth: number
  dueWithin30Days: number
  deliveriesThisMonth: number
  cSectionRate: number
  highRiskCount: number
  ttVaccineCoverage: number
  anc5PlusCoverage: number
  // MOPH 2568 + WHO indicators
  firstAncBefore12Weeks: number
  anc8QualityCompletion: number
  lowBirthWeightRate: number
  pretermBirthRate: number
  lowApgarRate: number
  stillbirthRate: number
}

export interface KpiCardConfig {
  key: keyof PregnancyKpis
  title: string
  icon: string
  color: string
  format: 'number' | 'percentage'
}

// ---------------------------------------------------------------------------
// Chart Data Types
// ---------------------------------------------------------------------------

export interface DeliveryTrendData {
  month: string
  deliveries: number
}

export interface DeliveryTypeData {
  type: string
  count: number
  percentage: number
}

export interface GaDistributionData {
  category: string
  count: number
}

export interface BirthWeightData {
  category: string
  count: number
}

export interface ApgarScoreData {
  scoreRange: string
  oneMin: number
  fiveMin: number
}

export interface AncComplianceData {
  visitCount: number
  patientCount: number
}

// ---------------------------------------------------------------------------
// Table Data Types
// ---------------------------------------------------------------------------

export interface RecentDelivery {
  laborDate: string
  hn: string
  patientName: string
  ga: number | null
  deliveryType: string | null
  birthWeight: number | null
  apgar1: number | null
  apgar5: number | null
}

export interface HighRiskPregnancy {
  hn: string
  patientName: string
  edc: string | null
  riskLevel: number | null
  riskList: string | null
}

export interface UpcomingEdc {
  hn: string
  patientName: string
  edc: string
  daysRemaining: number
}

// ---------------------------------------------------------------------------
// Dashboard State Types
// ---------------------------------------------------------------------------

export interface PregnancyDashboardData {
  kpis: PregnancyKpis | null
  deliveryTrend: DeliveryTrendData[]
  deliveryTypes: DeliveryTypeData[]
  gaDistribution: GaDistributionData[]
  birthWeight: BirthWeightData[]
  apgarScores: ApgarScoreData[]
  ancCompliance: AncComplianceData[]
  recentDeliveries: RecentDelivery[]
  highRiskPregnancies: HighRiskPregnancy[]
  upcomingEdc: UpcomingEdc[]
}

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

export function isPregnancyKpis(value: unknown): value is PregnancyKpis {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.activePregnancies === 'number' &&
    typeof obj.newAncThisMonth === 'number' &&
    typeof obj.dueWithin30Days === 'number' &&
    typeof obj.deliveriesThisMonth === 'number' &&
    typeof obj.cSectionRate === 'number' &&
    typeof obj.highRiskCount === 'number' &&
    typeof obj.ttVaccineCoverage === 'number' &&
    typeof obj.anc5PlusCoverage === 'number' &&
    typeof obj.firstAncBefore12Weeks === 'number' &&
    typeof obj.anc8QualityCompletion === 'number' &&
    typeof obj.lowBirthWeightRate === 'number' &&
    typeof obj.pretermBirthRate === 'number' &&
    typeof obj.lowApgarRate === 'number' &&
    typeof obj.stillbirthRate === 'number'
  )
}

export function isDeliveryTrendData(value: unknown): value is DeliveryTrendData {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.month === 'string' &&
    typeof obj.deliveries === 'number'
  )
}

export function isDeliveryTypeData(value: unknown): value is DeliveryTypeData {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.type === 'string' &&
    typeof obj.count === 'number' &&
    typeof obj.percentage === 'number'
  )
}

export function isRecentDelivery(value: unknown): value is RecentDelivery {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.laborDate === 'string' &&
    typeof obj.hn === 'string' &&
    typeof obj.patientName === 'string'
  )
}

export function isHighRiskPregnancy(value: unknown): value is HighRiskPregnancy {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.hn === 'string' &&
    typeof obj.patientName === 'string'
  )
}

export function isUpcomingEdc(value: unknown): value is UpcomingEdc {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.hn === 'string' &&
    typeof obj.patientName === 'string' &&
    typeof obj.edc === 'string' &&
    typeof obj.daysRemaining === 'number'
  )
}
