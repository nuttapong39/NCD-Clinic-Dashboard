// src/utils/dataParser.ts

export function parseArray<T>(data: unknown): T[] {
  if (!Array.isArray(data)) return []
  return data as T[]
}

export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const num = Number(value)
  return isNaN(num) ? null : num
}
