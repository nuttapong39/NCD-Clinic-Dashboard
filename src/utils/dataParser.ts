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
