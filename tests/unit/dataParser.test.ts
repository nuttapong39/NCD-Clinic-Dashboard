// tests/unit/dataParser.test.ts
import { describe, it, expect } from 'vitest'
import { parseArray, parseNumber } from '@/utils/dataParser'

describe('parseArray', () => {
  it('MUST return typed array when input is valid array', () => {
    const input = [1, 2, 3]
    const result = parseArray<number>(input)
    expect(result).toEqual([1, 2, 3])
  })

  it('MUST return empty array when input is not an array', () => {
    expect(parseArray('not an array')).toEqual([])
    expect(parseArray(42)).toEqual([])
    expect(parseArray({ key: 'value' })).toEqual([])
  })

  it('MUST return empty array when input is null', () => {
    expect(parseArray(null)).toEqual([])
  })

  it('MUST return empty array when input is undefined', () => {
    expect(parseArray(undefined)).toEqual([])
  })
})

describe('parseNumber', () => {
  it('MUST return number when input is valid numeric value', () => {
    expect(parseNumber(42)).toBe(42)
    expect(parseNumber('3.14')).toBe(3.14)
    expect(parseNumber(0)).toBe(0)
  })

  it('MUST return null when input is null', () => {
    expect(parseNumber(null)).toBeNull()
  })

  it('MUST return null when input is undefined', () => {
    expect(parseNumber(undefined)).toBeNull()
  })

  it('MUST return null when input is NaN string', () => {
    expect(parseNumber('not-a-number')).toBeNull()
    expect(parseNumber('abc')).toBeNull()
  })

  it('MUST strip thousands separators from numeric strings', () => {
    expect(parseNumber('1,234')).toBe(1234)
  })

  it('MUST return null for empty strings', () => {
    expect(parseNumber('')).toBeNull()
  })
})
