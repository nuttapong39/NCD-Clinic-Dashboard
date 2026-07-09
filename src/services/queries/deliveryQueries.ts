// src/services/queries/deliveryQueries.ts
// =============================================================================
// Delivery SQL Query Generators
// =============================================================================

import type { DatabaseType } from '@/types'
import { monthStart, monthsAgo, currentDateString, daysAhead, daysAgo, formatMonthColumn, calcGa } from './queryHelpers'

export function getDueWithin30Days(dbType: DatabaseType): string {
  return `
    SELECT COUNT(*) as due_soon
    FROM person_anc pa
    JOIN person p ON pa.person_id = p.person_id
    WHERE pa.labor_date IS NULL
      AND pa.edc BETWEEN ${currentDateString(dbType)} AND ${daysAhead(dbType, 30)}
  `.trim()
}

export function getDeliveriesThisMonth(dbType: DatabaseType): string {
  return `
    SELECT COUNT(*) as deliveries
    FROM ipt_labour il
    JOIN ipt i ON il.an = i.an
    WHERE i.regdate >= ${monthStart(dbType)}
      AND il.delivery_type_id IN (1, 2)
  `.trim()
}

export function getCSectionRate(dbType: DatabaseType): string {
  return `
    SELECT
      COALESCE(dt.deliver_name, 'ไม่ระบุ') as deliver_name,
      COUNT(*) as count
    FROM ipt_labour il
    JOIN ipt i ON il.an = i.an
    LEFT JOIN deliver_type dt ON il.delivery_type_id = dt.deliver_type
    WHERE i.regdate >= ${monthsAgo(dbType, 3)}
      AND il.delivery_type_id IN (1, 2)
    GROUP BY dt.deliver_name
  `.trim()
}

export function getPretermBirthRate(dbType: DatabaseType): string {
  return `
    SELECT
      ROUND(
        COUNT(CASE WHEN il.ga < 37 THEN 1 END) * 100.0 /
        NULLIF(COUNT(*), 0)
      , 1) as preterm_percent
    FROM ipt_labour il
    JOIN ipt i ON il.an = i.an
    WHERE i.regdate >= ${monthsAgo(dbType, 3)}
      AND il.ga IS NOT NULL
  `.trim()
}

export function getDeliveryTrend(dbType: DatabaseType): string {
  return `
    SELECT
      ${formatMonthColumn(dbType, 'i.regdate')} as month,
      COUNT(*) as deliveries
    FROM ipt_labour il
    JOIN ipt i ON il.an = i.an
    WHERE i.regdate >= ${monthsAgo(dbType, 3)}
      AND il.delivery_type_id IN (1, 2)
    GROUP BY ${formatMonthColumn(dbType, 'i.regdate')}
    ORDER BY month
  `.trim()
}

export function getGaDistribution(dbType: DatabaseType): string {
  return `
    SELECT
      CASE
        WHEN ga < 12 THEN '1st Trimester (<12w)'
        WHEN ga < 28 THEN '2nd Trimester (12-27w)'
        WHEN ga < 37 THEN '3rd Trimester (28-36w)'
        ELSE 'Term (37w+)'
      END as category,
      COUNT(*) as count
    FROM (
      SELECT
        ${calcGa(dbType)} as ga
      FROM person_anc pa
      JOIN person p ON pa.person_id = p.person_id
      WHERE pa.labor_date IS NULL
        AND pa.lmp IS NOT NULL
    ) sub
    GROUP BY category
  `.trim()
}

export function getRecentDeliveries(dbType: DatabaseType): string {
  return `
    SELECT
      i.regdate as laborDate,
      pt.hn,
      CONCAT(pt.pname, pt.fname, ' ', pt.lname) as patientName,
      il.ga,
      COALESCE(dt.deliver_name, 'ไม่ระบุ') as deliveryType,
      nb.birth_weight as birthWeight,
      nb.apgar1,
      nb.apgar2 as apgar5
    FROM ipt_labour il
    JOIN ipt i ON il.an = i.an
    JOIN patient pt ON i.hn = pt.hn
    LEFT JOIN deliver_type dt ON il.delivery_type_id = dt.deliver_type
    LEFT JOIN ipt_newborn nb ON il.an = nb.mother_an
    WHERE i.regdate >= ${daysAgo(dbType, 30)}
    ORDER BY i.regdate DESC
    LIMIT 50
  `.trim()
}

// ---------------------------------------------------------------------------
// Delivery KPI Detail Queries
// ---------------------------------------------------------------------------

export function detailDueWithin30Days(dbType: DatabaseType): string {
  const daysRemaining = dbType === 'mysql'
    ? 'DATEDIFF(pa.edc, CURDATE())'
    : '(pa.edc - CURRENT_DATE)::int'

  return `
    SELECT p.person_id as hn, CONCAT(p.pname, p.fname, ' ', p.lname) as patientName,
      pa.edc, ${daysRemaining} as daysRemaining,
      ${calcGa(dbType)} as gaWeeks,
      CASE WHEN pa.has_risk = 'Y' THEN 'เสี่ยง' ELSE 'ปกติ' END as riskStatus
    FROM person_anc pa
    JOIN person p ON pa.person_id = p.person_id

    WHERE pa.labor_date IS NULL
      AND pa.edc BETWEEN ${currentDateString(dbType)} AND ${daysAhead(dbType, 30)}
    ORDER BY pa.edc ASC LIMIT 100
  `.trim()
}

export function detailDeliveriesThisMonth(dbType: DatabaseType): string {
  return `
    SELECT pt.hn, CONCAT(pt.pname, pt.fname, ' ', pt.lname) as patientName,
      i.regdate as laborDate,
      COALESCE(dt.deliver_name, 'ไม่ระบุ') as deliveryType,
      nb.birth_weight as birthWeight, il.ga
    FROM ipt_labour il
    JOIN ipt i ON il.an = i.an
    JOIN patient pt ON i.hn = pt.hn
    LEFT JOIN deliver_type dt ON il.delivery_type_id = dt.deliver_type
    LEFT JOIN ipt_newborn nb ON il.an = nb.mother_an
    WHERE i.regdate >= ${monthStart(dbType)}
      AND il.delivery_type_id IN (1, 2)
    ORDER BY i.regdate DESC LIMIT 100
  `.trim()
}

export function detailCSectionRate(dbType: DatabaseType): string {
  return `
    SELECT pt.hn, CONCAT(pt.pname, pt.fname, ' ', pt.lname) as patientName,
      i.regdate as laborDate,
      COALESCE(dt.deliver_name, 'ไม่ระบุ') as deliveryType,
      nb.birth_weight as birthWeight, il.ga
    FROM ipt_labour il
    JOIN ipt i ON il.an = i.an
    JOIN patient pt ON i.hn = pt.hn
    LEFT JOIN deliver_type dt ON il.delivery_type_id = dt.deliver_type
    LEFT JOIN ipt_newborn nb ON il.an = nb.mother_an
    WHERE i.regdate >= ${monthsAgo(dbType, 3)}
      AND il.delivery_type_id IN (1, 2)
    ORDER BY dt.deliver_name, i.regdate DESC LIMIT 100
  `.trim()
}

export function detailPretermBirth(dbType: DatabaseType): string {
  return `
    SELECT pt.hn, CONCAT(pt.pname, pt.fname, ' ', pt.lname) as patientName,
      i.regdate as laborDate, il.ga,
      COALESCE(dt.deliver_name, 'ไม่ระบุ') as deliveryType,
      nb.birth_weight as birthWeight
    FROM ipt_labour il
    JOIN ipt i ON il.an = i.an
    JOIN patient pt ON i.hn = pt.hn
    LEFT JOIN deliver_type dt ON il.delivery_type_id = dt.deliver_type
    LEFT JOIN ipt_newborn nb ON il.an = nb.mother_an
    WHERE i.regdate >= ${monthsAgo(dbType, 3)}
      AND il.ga IS NOT NULL AND il.ga < 37
    ORDER BY il.ga ASC LIMIT 100
  `.trim()
}
