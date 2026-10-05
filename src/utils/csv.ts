// =============================================================================
// CSV export (RFC 4180, UTF-8 BOM for Excel) — UI-TEMPLATE §9.6
// =============================================================================

const BOM = '﻿'
const LINE_BREAK = '\r\n'

type CsvValue = string | number | null | undefined

function escapeField(value: CsvValue): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

export function toCsv<K extends string>(columns: readonly K[], rows: readonly Record<K, CsvValue>[]): string {
  const lines = [columns.join(','), ...rows.map((row) => columns.map((column) => escapeField(row[column])).join(','))]
  return BOM + lines.join(LINE_BREAK)
}

/** Triggers a browser download of CSV text. */
export function downloadCsv(filename: string, csv: string): void {
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
