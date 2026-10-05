import { describe, it, expect } from 'vitest'
import { toCsv } from '@/utils/csv'

describe('toCsv', () => {
  it('MUST start with a UTF-8 BOM so Excel reads Thai text', () => {
    const csv = toCsv(['name'], [{ name: 'สมชาย' }])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })

  it('MUST write the header row followed by data rows with CRLF line endings', () => {
    const csv = toCsv(['hn', 'count'], [{ hn: '001', count: 3 }, { hn: '002', count: 0 }])
    expect(csv.slice(1)).toBe('hn,count\r\n001,3\r\n002,0')
  })

  it('MUST quote fields containing commas, quotes or line breaks (RFC 4180)', () => {
    const csv = toCsv(['note'], [{ note: 'a,b' }, { note: 'say "hi"' }, { note: 'line\nbreak' }])
    expect(csv.slice(1)).toBe('note\r\n"a,b"\r\n"say ""hi"""\r\n"line\nbreak"')
  })

  it('MUST write empty fields for null and undefined values', () => {
    const csv = toCsv(['a', 'b'], [{ a: null, b: undefined }])
    expect(csv.slice(1)).toBe('a,b\r\n,')
  })
})
