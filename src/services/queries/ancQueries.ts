// src/services/queries/ancQueries.ts
// =============================================================================
// ANC (Antenatal Care) SQL Query Generators
// =============================================================================

import type { DatabaseType } from '@/types'
import { calcGa, monthStart, monthsAgo, currentDateString, daysAhead } from './queryHelpers'

export function getActivePregnancies(_dbType: DatabaseType): string {
  return `
    SELECT COUNT(*) as active_pregnancies
    FROM person_anc pa
    JOIN person p ON pa.person_id = p.person_id
    WHERE pa.labor_date IS NULL
      AND (pa.discharge IS NULL OR pa.discharge = 'N')
  `.trim()
}

export function getNewAncThisMonth(dbType: DatabaseType): string {
  return `
    SELECT COUNT(*) as new_anc
    FROM person_anc pa
    JOIN person p ON pa.person_id = p.person_id
    WHERE pa.anc_register_date >= ${monthStart(dbType)}
  `.trim()
}

export function getHighRiskCount(_dbType: DatabaseType): string {
  return `
    SELECT COUNT(*) as high_risk
    FROM person_anc pa
    JOIN person p ON pa.person_id = p.person_id
    WHERE pa.has_risk = 'Y'
      AND pa.labor_date IS NULL
  `.trim()
}

export function getFirstAncBefore12Weeks(dbType: DatabaseType): string {
  const weeksDiff = dbType === 'mysql'
    ? 'DATEDIFF(pa.anc_register_date, pa.lmp) / 7'
    : "EXTRACT(DAYS FROM (pa.anc_register_date::date - pa.lmp::date)) / 7"

  return `
    SELECT
      ROUND(
        COUNT(CASE WHEN ${weeksDiff} < 12 THEN 1 END) * 100.0 /
        NULLIF(COUNT(*), 0)
      , 1) as early_anc_percent
    FROM person_anc pa
    JOIN person p ON pa.person_id = p.person_id
    WHERE pa.anc_register_date IS NOT NULL
      AND pa.lmp IS NOT NULL
      AND (pa.labor_date >= ${monthsAgo(dbType, 3)} OR pa.labor_date IS NULL)
  `.trim()
}

export function getAnc5PlusCoverage(dbType: DatabaseType): string {
  return `
    SELECT
      ROUND(
        COUNT(CASE WHEN visit_count >= 5 THEN 1 END) * 100.0 /
        NULLIF(COUNT(*), 0)
      , 1) as anc5_plus_percent
    FROM (
      SELECT
        pa.person_anc_id,
        COUNT(papc.person_anc_preg_care_id) as visit_count
      FROM person_anc pa
      JOIN person p ON pa.person_id = p.person_id
      LEFT JOIN person_anc_preg_care papc ON pa.person_anc_id = papc.person_anc_id
      WHERE pa.labor_date >= ${monthsAgo(dbType, 3)}
      GROUP BY pa.person_anc_id
    ) sub
  `.trim()
}

export function getAnc8QualityCompletion(dbType: DatabaseType): string {
  return `
    SELECT
      ROUND(
        COUNT(CASE WHEN sub.visit_count >= 8 AND pl.birth_weight >= 2500 THEN 1 END) * 100.0 /
        NULLIF(COUNT(*), 0)
      , 1) as anc8_quality_percent
    FROM (
      SELECT
        pa.person_anc_id,
        pa.person_id,
        COUNT(papc.person_anc_preg_care_id) as visit_count
      FROM person_anc pa
      JOIN person p ON pa.person_id = p.person_id
      LEFT JOIN person_anc_preg_care papc ON pa.person_anc_id = papc.person_anc_id
      WHERE pa.labor_date >= ${monthsAgo(dbType, 6)}
      GROUP BY pa.person_anc_id, pa.person_id
    ) sub
    LEFT JOIN person_labour pl ON sub.person_id = pl.person_id
  `.trim()
}

export function getTtVaccineCoverage(dbType: DatabaseType): string {
  return `
    SELECT
      ROUND(
        COUNT(CASE WHEN pa.vaccine_tt_complete = 'Y' THEN 1 END) * 100.0 /
        NULLIF(COUNT(*), 0)
      , 1) as tt_coverage_percent
    FROM person_anc pa
    JOIN person p ON pa.person_id = p.person_id
    WHERE pa.labor_date >= ${monthsAgo(dbType, 3)}
      OR pa.labor_date IS NULL
  `.trim()
}

export function getHighRiskPregnancies(_dbType: DatabaseType): string {
  return `
    SELECT
      p.person_id as hn,
      CONCAT(p.pname, p.fname, ' ', p.lname) as patientName,
      pa.edc,
      pa.risk_level as riskLevel,
      pa.risk_list as riskList
    FROM person_anc pa
    JOIN person p ON pa.person_id = p.person_id

    WHERE pa.has_risk = 'Y'
      AND pa.labor_date IS NULL
    ORDER BY pa.edc ASC
    LIMIT 50
  `.trim()
}

export function getUpcomingEdc(dbType: DatabaseType): string {
  const daysRemaining = dbType === 'mysql'
    ? 'DATEDIFF(pa.edc, CURDATE())'
    : '(pa.edc - CURRENT_DATE)::int'

  return `
    SELECT
      p.person_id as hn,
      CONCAT(p.pname, p.fname, ' ', p.lname) as patientName,
      pa.edc,
      ${daysRemaining} as daysRemaining
    FROM person_anc pa
    JOIN person p ON pa.person_id = p.person_id

    WHERE pa.labor_date IS NULL
      AND pa.edc BETWEEN ${currentDateString(dbType)} AND ${daysAhead(dbType, 30)}
    ORDER BY pa.edc ASC
  `.trim()
}

// ---------------------------------------------------------------------------
// ANC KPI Detail Queries
// ---------------------------------------------------------------------------

export function detailActivePregnancies(dbType: DatabaseType): string {
  return `
    SELECT p.person_id as hn, CONCAT(p.pname, p.fname, ' ', p.lname) as patientName,
      pa.anc_register_date as ancDate, pa.lmp, pa.edc,
      ${calcGa(dbType)} as gaWeeks,
      CASE WHEN pa.has_risk = 'Y' THEN 'เสี่ยง' ELSE 'ปกติ' END as riskStatus
    FROM person_anc pa
    JOIN person p ON pa.person_id = p.person_id

    WHERE pa.labor_date IS NULL AND (pa.discharge IS NULL OR pa.discharge = 'N')
    ORDER BY pa.edc ASC LIMIT 100
  `.trim()
}

export function detailNewAncThisMonth(dbType: DatabaseType): string {
  return `
    SELECT p.person_id as hn, CONCAT(p.pname, p.fname, ' ', p.lname) as patientName,
      pa.anc_register_date as ancDate, pa.lmp, pa.edc,
      ${calcGa(dbType)} as gaWeeks
    FROM person_anc pa
    JOIN person p ON pa.person_id = p.person_id

    WHERE pa.anc_register_date >= ${monthStart(dbType)}
    ORDER BY pa.anc_register_date DESC LIMIT 100
  `.trim()
}

export function detailFirstAncBefore12Weeks(dbType: DatabaseType): string {
  const weeksDiff = dbType === 'mysql'
    ? 'ROUND(DATEDIFF(pa.anc_register_date, pa.lmp) / 7, 1)'
    : "ROUND(EXTRACT(DAYS FROM (pa.anc_register_date::date - pa.lmp::date)) / 7.0, 1)"

  return `
    SELECT p.person_id as hn, CONCAT(p.pname, p.fname, ' ', p.lname) as patientName,
      pa.anc_register_date as ancDate, pa.lmp,
      ${weeksDiff} as gaAtFirstVisit,
      CASE WHEN ${weeksDiff} < 12 THEN 'ทันเวลา' ELSE 'ช้ากว่ากำหนด' END as status
    FROM person_anc pa
    JOIN person p ON pa.person_id = p.person_id

    WHERE pa.anc_register_date IS NOT NULL AND pa.lmp IS NOT NULL
      AND (pa.labor_date >= ${monthsAgo(dbType, 3)} OR pa.labor_date IS NULL)
    ORDER BY ${weeksDiff} ASC LIMIT 100
  `.trim()
}

export function detailHighRisk(_dbType: DatabaseType): string {
  return `
    SELECT p.person_id as hn, CONCAT(p.pname, p.fname, ' ', p.lname) as patientName,
      pa.edc, pa.risk_level as riskLevel, pa.risk_list as riskDetail
    FROM person_anc pa
    JOIN person p ON pa.person_id = p.person_id

    WHERE pa.has_risk = 'Y' AND pa.labor_date IS NULL
    ORDER BY pa.risk_level DESC, pa.edc ASC LIMIT 100
  `.trim()
}

export function detailAnc5Plus(dbType: DatabaseType): string {
  return `
    SELECT p.person_id as hn, CONCAT(p.pname, p.fname, ' ', p.lname) as patientName,
      pa.edc, sub.visit_count as visitCount
    FROM (
      SELECT pa2.person_anc_id, pa2.person_id,
        COUNT(papc.person_anc_preg_care_id) as visit_count
      FROM person_anc pa2
      LEFT JOIN person_anc_preg_care papc ON pa2.person_anc_id = papc.person_anc_id
      WHERE pa2.labor_date >= ${monthsAgo(dbType, 3)} OR pa2.labor_date IS NULL
      GROUP BY pa2.person_anc_id, pa2.person_id
    ) sub
    JOIN person_anc pa ON sub.person_anc_id = pa.person_anc_id
    JOIN person p ON sub.person_id = p.person_id

    ORDER BY sub.visit_count DESC LIMIT 100
  `.trim()
}

export function detailAnc8Quality(dbType: DatabaseType): string {
  return `
    SELECT p.person_id as hn, CONCAT(p.pname, p.fname, ' ', p.lname) as patientName,
      sub.visit_count as visitCount, pl.birth_weight as birthWeight,
      CASE WHEN sub.visit_count >= 8 AND pl.birth_weight >= 2500 THEN 'ผ่านเกณฑ์' ELSE 'ไม่ผ่าน' END as status
    FROM (
      SELECT pa2.person_anc_id, pa2.person_id,
        COUNT(papc.person_anc_preg_care_id) as visit_count
      FROM person_anc pa2
      LEFT JOIN person_anc_preg_care papc ON pa2.person_anc_id = papc.person_anc_id
      WHERE pa2.labor_date >= ${monthsAgo(dbType, 6)}
      GROUP BY pa2.person_anc_id, pa2.person_id
    ) sub
    JOIN person p ON sub.person_id = p.person_id

    LEFT JOIN person_labour pl ON sub.person_id = pl.person_id
    ORDER BY sub.visit_count DESC LIMIT 100
  `.trim()
}

export function detailTtVaccine(dbType: DatabaseType): string {
  return `
    SELECT p.person_id as hn, CONCAT(p.pname, p.fname, ' ', p.lname) as patientName,
      pa.edc,
      CASE WHEN pa.vaccine_tt_complete = 'Y' THEN 'ครบ' ELSE 'ไม่ครบ' END as ttStatus
    FROM person_anc pa
    JOIN person p ON pa.person_id = p.person_id

    WHERE pa.labor_date >= ${monthsAgo(dbType, 3)} OR pa.labor_date IS NULL
    ORDER BY pa.vaccine_tt_complete ASC, pa.edc ASC LIMIT 100
  `.trim()
}
