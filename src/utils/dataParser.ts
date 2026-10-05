// src/utils/dataParser.ts

export function parseArray<T>(data: unknown): T[] {
  if (!Array.isArray(data)) return []
  return data as T[]
}

export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'string' ? Number(value.replaceAll(',', '')) : Number(value)
  return isNaN(num) ? null : num
}

/** Trimmed text, or null for null/undefined/blank values from SQL rows. */
export function parseText(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  return trimmed === '' ? null : trimmed
}

/** A count from SQL rows; missing or non-numeric values count as zero. */
export function parseCount(value: unknown): number {
  return parseNumber(value) ?? 0
}
