import { describe, it, expect } from 'vitest'
import {
  formatNumber,
  formatPercent,
  formatChange,
  formatThaiDate,
  formatTime,
  formatCompact,
  NO_VALUE,
} from '@/utils/formatters'

describe('formatNumber', () => {
  it('MUST group thousands', () => {
    expect(formatNumber(1234)).toBe('1,234')
  })

  it('MUST show the no-value dash for null', () => {
    expect(formatNumber(null)).toBe(NO_VALUE)
  })
})

describe('formatPercent', () => {
  it('MUST keep one decimal and drop a trailing .0', () => {
    expect(formatPercent(24.44)).toBe('24.4%')
    expect(formatPercent(80)).toBe('80%')
  })

  it('MUST show the no-value dash for null', () => {
    expect(formatPercent(null)).toBe(NO_VALUE)
  })
})

describe('formatChange', () => {
  it('MUST prefix increases with a plus sign', () => {
    expect(formatChange(15)).toBe('+15%')
  })

  it('MUST keep the minus sign for decreases', () => {
    expect(formatChange(-2.5)).toBe('-2.5%')
  })

  it('MUST show zero without a sign', () => {
    expect(formatChange(0)).toBe('0%')
  })
})

describe('formatThaiDate', () => {
  it('MUST render day, Thai short month and Buddhist year', () => {
    expect(formatThaiDate('2025-10-01')).toBe('1 ต.ค. 2568')
  })

  it('MUST accept Date objects', () => {
    expect(formatThaiDate(new Date(2026, 8, 30))).toBe('30 ก.ย. 2569')
  })
})

describe('formatTime', () => {
  it('MUST render 24-hour time with the Thai suffix', () => {
    expect(formatTime(new Date(2026, 0, 1, 9, 5))).toBe('09:05 น.')
  })

  it('MUST trim HH:mm:ss strings from the database to HH:mm', () => {
    expect(formatTime('13:30:00')).toBe('13:30 น.')
  })

  it('MUST show the no-value dash for empty input', () => {
    expect(formatTime(null)).toBe(NO_VALUE)
  })
})

describe('formatCompact', () => {
  it('MUST abbreviate thousands and millions for chart axes', () => {
    expect(formatCompact(950)).toBe('950')
    expect(formatCompact(12500)).toBe('12.5k')
    expect(formatCompact(1_300_000)).toBe('1.3M')
  })
})
