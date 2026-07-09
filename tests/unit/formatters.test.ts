// tests/unit/formatters.test.ts
import { describe, it, expect } from 'vitest'
import { formatKpiValue, formatKpiDetailValue, buildKpiTooltipText } from '@/utils/formatters'

describe('formatKpiValue', () => {
  it('MUST return N/A when value is null', () => {
    expect(formatKpiValue(null, 'number')).toBe('N/A')
    expect(formatKpiValue(null, 'percentage')).toBe('N/A')
  })

  it('MUST format as percentage when format is percentage', () => {
    expect(formatKpiValue(25.5, 'percentage')).toBe('25.5%')
    expect(formatKpiValue(0, 'percentage')).toBe('0.0%')
    expect(formatKpiValue(100, 'percentage')).toBe('100.0%')
  })

  it('MUST format as Thai locale number when format is number', () => {
    const result = formatKpiValue(1234, 'number')
    // Thai locale formats 1234 as "1,234"
    expect(result).toBe((1234).toLocaleString('th-TH'))
  })
})

describe('formatKpiDetailValue', () => {
  it('MUST return empty string when value is null', () => {
    expect(formatKpiDetailValue('cSectionRate', null)).toBe('')
    expect(formatKpiDetailValue(null, null)).toBe('')
  })

  it('MUST format as percentage for percentage KPI keys', () => {
    expect(formatKpiDetailValue('cSectionRate', 25.5)).toBe('25.5%')
    expect(formatKpiDetailValue('ttVaccineCoverage', 80.0)).toBe('80.0%')
    expect(formatKpiDetailValue('anc5PlusCoverage', 75.0)).toBe('75.0%')
    expect(formatKpiDetailValue('lowBirthWeightRate', 8.5)).toBe('8.5%')
  })

  it('MUST format as Thai locale number for non-percentage KPI keys', () => {
    const result = formatKpiDetailValue('activePregnancies', 1234)
    expect(result).toBe((1234).toLocaleString('th-TH'))
  })
})

describe('buildKpiTooltipText', () => {
  it('MUST return description with dataSource when both provided', () => {
    const result = buildKpiTooltipText('Some description', 'person_anc')
    expect(result).toContain('Some description')
    expect(result).toContain('person_anc')
  })

  it('MUST return description with click hint when onClick is true', () => {
    const result = buildKpiTooltipText('Some description', undefined, true)
    expect(result).toContain('Some description')
    expect(result).toContain('คลิกเพื่อดูรายละเอียด')
  })

  it('MUST return dataSource only when no description', () => {
    const result = buildKpiTooltipText(undefined, 'person_anc')
    expect(result).toContain('person_anc')
    expect(result).not.toContain('คลิกเพื่อดูรายละเอียด')
  })

  it('MUST return empty string when no description and no dataSource', () => {
    expect(buildKpiTooltipText()).toBe('')
    expect(buildKpiTooltipText(undefined, undefined)).toBe('')
  })
})
