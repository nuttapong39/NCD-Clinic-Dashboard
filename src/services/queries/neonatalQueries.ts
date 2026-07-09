// src/services/queries/neonatalQueries.ts
// =============================================================================
// Neonatal Outcome SQL Query Generators
// =============================================================================

import type { DatabaseType } from '@/types'
import { monthsAgo } from './queryHelpers'

export function getLowBirthWeightRate(dbType: DatabaseType): string {
  return `
    SELECT
      ROUND(
        COUNT(CASE WHEN nb.birth_weight < 2500 THEN 1 END) * 100.0 /
        NULLIF(COUNT(*), 0)
      , 1) as low_bw_percent
    FROM ipt_newborn nb
    JOIN ipt mi ON nb.mother_an = mi.an
    WHERE nb.born_date >= ${monthsAgo(dbType, 3)}
      AND nb.birth_weight IS NOT NULL
  `.trim()
}

export function getLowApgarRate(dbType: DatabaseType): string {
  return `
    SELECT
      ROUND(
        COUNT(CASE WHEN nb.apgar2 < 7 THEN 1 END) * 100.0 /
        NULLIF(COUNT(*), 0)
      , 1) as low_apgar_percent
    FROM ipt_newborn nb
    JOIN ipt mi ON nb.mother_an = mi.an
    WHERE nb.born_date >= ${monthsAgo(dbType, 3)}
      AND nb.apgar2 IS NOT NULL
  `.trim()
}

export function getStillbirthRate(dbType: DatabaseType): string {
  return `
    SELECT
      ROUND(
        COUNT(CASE WHEN nb.dead = 'Y' THEN 1 END) * 100.0 /
        NULLIF(COUNT(*), 0)
      , 1) as stillbirth_percent
    FROM ipt_newborn nb
    JOIN ipt mi ON nb.mother_an = mi.an
    WHERE nb.born_date >= ${monthsAgo(dbType, 6)}
  `.trim()
}

export function getBirthWeightDistribution(dbType: DatabaseType): string {
  return `
    SELECT
      CASE
        WHEN nb.birth_weight < 2500 THEN 'Low (<2500g)'
        WHEN nb.birth_weight > 4000 THEN 'High (>4000g)'
        ELSE 'Normal (2500-4000g)'
      END as category,
      COUNT(*) as count
    FROM ipt_newborn nb
    JOIN ipt mi ON nb.mother_an = mi.an
    WHERE nb.born_date >= ${monthsAgo(dbType, 3)}
      AND nb.birth_weight IS NOT NULL
    GROUP BY category
  `.trim()
}

export function getAncCompliance(dbType: DatabaseType): string {
  return `
    SELECT
      visit_count,
      COUNT(*) as patient_count
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
    GROUP BY visit_count
    ORDER BY visit_count
  `.trim()
}

// ---------------------------------------------------------------------------
// Neonatal KPI Detail Queries
// ---------------------------------------------------------------------------

export function detailLowBirthWeight(dbType: DatabaseType): string {
  return `
    SELECT pt.hn, CONCAT(pt.pname, pt.fname, ' ', pt.lname) as patientName,
      nb.born_date as laborDate, nb.birth_weight as birthWeight,
      nb.apgar1, nb.apgar2 as apgar5
    FROM ipt_newborn nb
    JOIN ipt mi ON nb.mother_an = mi.an
    JOIN patient pt ON mi.hn = pt.hn
    WHERE nb.born_date >= ${monthsAgo(dbType, 3)}
      AND nb.birth_weight < 2500
      AND nb.birth_weight IS NOT NULL
    ORDER BY nb.birth_weight ASC LIMIT 100
  `.trim()
}

export function detailLowApgar(dbType: DatabaseType): string {
  return `
    SELECT pt.hn, CONCAT(pt.pname, pt.fname, ' ', pt.lname) as patientName,
      nb.born_date as laborDate,
      nb.apgar1, nb.apgar2 as apgar5,
      nb.birth_weight as birthWeight
    FROM ipt_newborn nb
    JOIN ipt mi ON nb.mother_an = mi.an
    JOIN patient pt ON mi.hn = pt.hn
    WHERE nb.born_date >= ${monthsAgo(dbType, 3)}
      AND nb.apgar2 < 7
      AND nb.apgar2 IS NOT NULL
    ORDER BY nb.apgar2 ASC LIMIT 100
  `.trim()
}

export function detailStillbirth(dbType: DatabaseType): string {
  return `
    SELECT pt.hn, CONCAT(pt.pname, pt.fname, ' ', pt.lname) as patientName,
      nb.born_date as laborDate,
      nb.birth_weight as birthWeight
    FROM ipt_newborn nb
    JOIN ipt mi ON nb.mother_an = mi.an
    JOIN patient pt ON mi.hn = pt.hn
    WHERE nb.born_date >= ${monthsAgo(dbType, 6)}
      AND nb.dead = 'Y'
    ORDER BY nb.born_date DESC LIMIT 100
  `.trim()
}
