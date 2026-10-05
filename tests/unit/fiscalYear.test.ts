import { describe, it, expect } from 'vitest'
import {
  fiscalYearOf,
  fiscalYearRange,
  fiscalMonths,
  fiscalMonthLabel,
  fiscalYearOptions,
  elapsedMonths,
  comparisonRange,
} from '@/utils/fiscalYear'

describe('fiscalYearOf', () => {
  it('MUST count October–December as the next Buddhist-era fiscal year', () => {
    expect(fiscalYearOf(new Date(2025, 9, 1))).toBe(2569)
    expect(fiscalYearOf(new Date(2025, 11, 31))).toBe(2569)
  })

  it('MUST keep January–September in the same fiscal year', () => {
    expect(fiscalYearOf(new Date(2026, 0, 1))).toBe(2569)
    expect(fiscalYearOf(new Date(2026, 8, 30))).toBe(2569)
  })
})

describe('fiscalYearRange', () => {
  it('MUST span 1 Oct of the previous Gregorian year to 30 Sep', () => {
    expect(fiscalYearRange(2569)).toEqual({ start: '2025-10-01', end: '2026-09-30' })
  })
})

describe('comparisonRange', () => {
  it('MUST cover the previous fiscal year and the selected one (24 months)', () => {
    expect(comparisonRange(2569)).toEqual({ start: '2024-10-01', end: '2026-09-30' })
  })
})

describe('fiscalMonths', () => {
  it('MUST list 12 months from October to September', () => {
    const months = fiscalMonths(2569)
    expect(months).toHaveLength(12)
    expect(months[0]).toBe('2025-10')
    expect(months[3]).toBe('2026-01')
    expect(months[11]).toBe('2026-09')
  })
})

describe('fiscalMonthLabel', () => {
  it('MUST render a Thai short month with a two-digit Buddhist year', () => {
    expect(fiscalMonthLabel('2025-10')).toBe('ต.ค. 68')
    expect(fiscalMonthLabel('2026-01')).toBe('ม.ค. 69')
  })
})

describe('fiscalYearOptions', () => {
  it('MUST list the current fiscal year and the previous ones, newest first', () => {
    expect(fiscalYearOptions(2569, 3)).toEqual([2569, 2568, 2567])
  })
})

describe('elapsedMonths', () => {
  it('MUST count months up to and including the current month', () => {
    expect(elapsedMonths(2569, new Date(2025, 9, 5))).toBe(1)
    expect(elapsedMonths(2569, new Date(2025, 11, 31))).toBe(3)
  })

  it('MUST return 12 for a fiscal year that has ended', () => {
    expect(elapsedMonths(2568, new Date(2025, 9, 5))).toBe(12)
  })

  it('MUST return 0 for a fiscal year that has not started', () => {
    expect(elapsedMonths(2570, new Date(2025, 9, 5))).toBe(0)
  })
})
