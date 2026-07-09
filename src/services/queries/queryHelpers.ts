// src/services/queries/queryHelpers.ts
// =============================================================================
// Shared date/time helper functions for SQL generation
// =============================================================================

import type { DatabaseType } from '@/types'

export function monthStart(dbType: DatabaseType): string {
  if (dbType === 'mysql') {
    return "DATE_FORMAT(CURDATE(), '%Y-%m-01')"
  }
  return "DATE_TRUNC('month', CURRENT_DATE)"
}

export function monthsAgo(dbType: DatabaseType, months: number): string {
  if (dbType === 'mysql') {
    return `DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL ${months} MONTH)`
  }
  return `DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '${months} months'`
}

export function daysAgo(dbType: DatabaseType, days: number): string {
  if (dbType === 'mysql') {
    return `DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`
  }
  return `CURRENT_DATE - INTERVAL '${days} days'`
}

export function daysAhead(dbType: DatabaseType, days: number): string {
  if (dbType === 'mysql') {
    return `DATE_ADD(CURDATE(), INTERVAL ${days} DAY)`
  }
  return `CURRENT_DATE + INTERVAL '${days} days'`
}

export function currentDateString(dbType: DatabaseType): string {
  return dbType === 'mysql' ? 'CURDATE()' : 'CURRENT_DATE'
}

export function formatMonthColumn(dbType: DatabaseType, column: string): string {
  if (dbType === 'mysql') {
    return `DATE_FORMAT(${column}, '%Y-%m')`
  }
  return `TO_CHAR(${column}, 'YYYY-MM')`
}

export function calcGa(dbType: DatabaseType): string {
  if (dbType === 'mysql') {
    return 'FLOOR(DATEDIFF(CURDATE(), pa.lmp) / 7)'
  }
  return "FLOOR(EXTRACT(DAYS FROM (CURRENT_DATE - pa.lmp::date)) / 7)"
}
