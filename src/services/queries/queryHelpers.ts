// src/services/queries/queryHelpers.ts
// =============================================================================
// Shared date helper functions for SQL generation
// =============================================================================

import type { DatabaseType } from '@/types'

export function currentDateString(dbType: DatabaseType): string {
  return dbType === 'mysql' ? 'CURDATE()' : 'CURRENT_DATE'
}
