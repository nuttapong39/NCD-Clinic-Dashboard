// src/services/pregnancyDataProcessing.ts
// Centralized business logic for pregnancy dashboard data processing

import type { DeliveryTypeData } from '@/types/pregnancy'

// ---------------------------------------------------------------------------
// processDeliveryTypes
// ---------------------------------------------------------------------------

/**
 * Calculates C-section rate and maps raw API rows into DeliveryTypeData[].
 * Moved from inline logic in PregnancyLaborDashboard.tsx.
 */
export function processDeliveryTypes(
  rawData: Record<string, unknown>[]
): { cSectionRate: number; deliveryTypes: DeliveryTypeData[] } {
  const typed = rawData as { deliver_name: string; count: number }[]
  const totalDeliveries = typed.reduce((sum, d) => sum + d.count, 0)

  const cSectionCount =
    typed.find(
      d =>
        d.deliver_name?.includes('ผิดปกติ')
    )?.count ?? 0

  const cSectionRate =
    totalDeliveries > 0 ? (cSectionCount / totalDeliveries) * 100 : 0

  const deliveryTypes: DeliveryTypeData[] = typed.map(d => ({
    type: d.deliver_name || 'ไม่ระบุ',
    count: d.count,
    percentage: totalDeliveries > 0 ? (d.count / totalDeliveries) * 100 : 0,
  }))

  return { cSectionRate, deliveryTypes }
}

// ---------------------------------------------------------------------------
// sortAndCalculatePercentages
// ---------------------------------------------------------------------------

/**
 * Sorts an array by a predefined order of category-field values, then appends a
 * rounded `percentage` field relative to the total `count` across all items.
 *
 * Used by GaDistributionChart and BirthWeightChart (both have a `category`
 * field; pass `categoryField = 'category'`).
 *
 * @param data         Array of objects that each have a `count: number` field.
 * @param orderKeys    Ordered list of category values defining the sort order.
 * @param categoryField  Name of the string field used for sorting / grouping.
 */
export function sortAndCalculatePercentages<T extends { count: number }>(
  data: T[],
  orderKeys: string[],
  categoryField: keyof T & string
): (T & { percentage: number })[] {
  const sorted = [...data].sort(
    (a, b) =>
      orderKeys.indexOf(a[categoryField] as string) -
      orderKeys.indexOf(b[categoryField] as string)
  )
  const total = sorted.reduce((sum, d) => sum + d.count, 0)
  return sorted.map(d => ({
    ...d,
    percentage: total > 0 ? Math.round((d.count / total) * 100) : 0,
  }))
}
