// src/utils/formatters.ts
import type { PregnancyKpis } from '@/types/pregnancy'

const PERCENTAGE_KPI_KEYS: (keyof PregnancyKpis)[] = [
  'cSectionRate', 'ttVaccineCoverage', 'anc5PlusCoverage', 'firstAncBefore12Weeks',
  'anc8QualityCompletion', 'lowBirthWeightRate', 'pretermBirthRate', 'lowApgarRate', 'stillbirthRate',
]

export function formatKpiValue(value: number | null, format: 'number' | 'percentage'): string {
  if (value === null) return 'N/A'
  return format === 'percentage'
    ? `${value.toFixed(1)}%`
    : value.toLocaleString('th-TH')
}

export function formatKpiDetailValue(kpiKey: keyof PregnancyKpis | null, value: number | null): string {
  if (value === null) return ''
  if (kpiKey && PERCENTAGE_KPI_KEYS.includes(kpiKey)) {
    return `${value.toFixed(1)}%`
  }
  return value.toLocaleString('th-TH')
}

export function buildKpiTooltipText(description?: string, dataSource?: string, hasOnClick?: boolean): string {
  if (description) {
    return `${description}${dataSource ? `\n\nตาราง: ${dataSource}` : ''}${hasOnClick ? '\n\nคลิกเพื่อดูรายละเอียด' : ''}`
  }
  return dataSource ? `แหล่งข้อมูล: ${dataSource}` : ''
}
