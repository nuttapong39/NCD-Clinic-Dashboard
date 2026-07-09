// tests/unit/pregnancyQueries.test.ts
import { describe, it, expect } from 'vitest'
import { pregnancyQueries } from '@/services/pregnancyQueries'
import type { DatabaseType } from '@/types'

describe('pregnancyQueries', () => {
  const mysql: DatabaseType = 'mysql'
  const postgresql: DatabaseType = 'postgresql'

  describe('getActivePregnancies', () => {
    it('MUST return compatible SQL for both databases', () => {
      const mysqlSql = pregnancyQueries.getActivePregnancies(mysql)
      const pgSql = pregnancyQueries.getActivePregnancies(postgresql)

      // Should be identical - no db-specific syntax
      expect(mysqlSql).toBe(pgSql)
      expect(mysqlSql).toContain('SELECT COUNT(*)')
      expect(mysqlSql).toContain('FROM person_anc')
      expect(mysqlSql).toContain('labor_date IS NULL')
    })
  })

  describe('getNewAncThisMonth', () => {
    it('MUST use DATE_FORMAT for MySQL', () => {
      const sql = pregnancyQueries.getNewAncThisMonth(mysql)
      expect(sql).toContain("DATE_FORMAT(CURDATE(), '%Y-%m-01')")
    })

    it('MUST use DATE_TRUNC for PostgreSQL', () => {
      const sql = pregnancyQueries.getNewAncThisMonth(postgresql)
      expect(sql).toContain("DATE_TRUNC('month', CURRENT_DATE)")
    })
  })

  describe('getDueWithin30Days', () => {
    it('MUST use DATE_ADD for MySQL', () => {
      const sql = pregnancyQueries.getDueWithin30Days(mysql)
      expect(sql).toContain('DATE_ADD(CURDATE(), INTERVAL 30 DAY)')
    })

    it('MUST use INTERVAL for PostgreSQL', () => {
      const sql = pregnancyQueries.getDueWithin30Days(postgresql)
      expect(sql).toContain("INTERVAL '30 days'")
    })
  })

  describe('getDeliveryTrend', () => {
    it('MUST use DATE_FORMAT for MySQL', () => {
      const sql = pregnancyQueries.getDeliveryTrend(mysql)
      expect(sql).toContain("DATE_FORMAT(pa.labor_date, '%Y-%m')")
    })

    it('MUST use TO_CHAR for PostgreSQL', () => {
      const sql = pregnancyQueries.getDeliveryTrend(postgresql)
      expect(sql).toContain("TO_CHAR(pa.labor_date, 'YYYY-MM')")
    })
  })

  describe('getGaDistribution', () => {
    it('MUST use DATEDIFF for MySQL', () => {
      const sql = pregnancyQueries.getGaDistribution(mysql)
      expect(sql).toContain('DATEDIFF(CURDATE(), pa.lmp)')
    })

    it('MUST use EXTRACT for PostgreSQL', () => {
      const sql = pregnancyQueries.getGaDistribution(postgresql)
      expect(sql).toContain('EXTRACT(DAYS FROM')
    })
  })

  describe('getRecentDeliveries', () => {
    it('MUST use DATE_SUB for MySQL', () => {
      const sql = pregnancyQueries.getRecentDeliveries(mysql)
      expect(sql).toContain('DATE_SUB(CURDATE(), INTERVAL 30 DAY)')
    })

    it('MUST use INTERVAL for PostgreSQL', () => {
      const sql = pregnancyQueries.getRecentDeliveries(postgresql)
      expect(sql).toContain("INTERVAL '30 days'")
    })
  })

  // Additional tests for remaining functions
  describe('getDeliveriesThisMonth', () => {
    it('MUST use DATE_FORMAT for MySQL', () => {
      const sql = pregnancyQueries.getDeliveriesThisMonth(mysql)
      expect(sql).toContain("DATE_FORMAT(CURDATE(), '%Y-%m-01')")
    })

    it('MUST use DATE_TRUNC for PostgreSQL', () => {
      const sql = pregnancyQueries.getDeliveriesThisMonth(postgresql)
      expect(sql).toContain("DATE_TRUNC('month', CURRENT_DATE)")
    })
  })

  describe('getCSectionRate', () => {
    it('MUST use DATE_SUB with DATE_FORMAT for MySQL', () => {
      const sql = pregnancyQueries.getCSectionRate(mysql)
      expect(sql).toContain("DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 3 MONTH)")
    })

    it('MUST use DATE_TRUNC with INTERVAL for PostgreSQL', () => {
      const sql = pregnancyQueries.getCSectionRate(postgresql)
      expect(sql).toContain("DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'")
    })
  })

  describe('getHighRiskCount', () => {
    it('MUST return compatible SQL for both databases', () => {
      const mysqlSql = pregnancyQueries.getHighRiskCount(mysql)
      const pgSql = pregnancyQueries.getHighRiskCount(postgresql)

      // Should be identical - no db-specific syntax
      expect(mysqlSql).toBe(pgSql)
      expect(mysqlSql).toContain('SELECT COUNT(*)')
      expect(mysqlSql).toContain("pa.has_risk = 'Y'")
    })
  })

  describe('getTtVaccineCoverage', () => {
    it('MUST use monthsAgo helper for MySQL', () => {
      const sql = pregnancyQueries.getTtVaccineCoverage(mysql)
      expect(sql).toContain("DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 3 MONTH)")
    })

    it('MUST use monthsAgo helper for PostgreSQL', () => {
      const sql = pregnancyQueries.getTtVaccineCoverage(postgresql)
      expect(sql).toContain("DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'")
    })
  })

  describe('getAnc5PlusCoverage', () => {
    it('MUST use monthsAgo helper for MySQL', () => {
      const sql = pregnancyQueries.getAnc5PlusCoverage(mysql)
      expect(sql).toContain("DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 3 MONTH)")
    })

    it('MUST use monthsAgo helper for PostgreSQL', () => {
      const sql = pregnancyQueries.getAnc5PlusCoverage(postgresql)
      expect(sql).toContain("DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'")
    })
  })

  describe('getBirthWeightDistribution', () => {
    it('MUST use monthsAgo helper for MySQL', () => {
      const sql = pregnancyQueries.getBirthWeightDistribution(mysql)
      expect(sql).toContain("DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 3 MONTH)")
    })

    it('MUST use monthsAgo helper for PostgreSQL', () => {
      const sql = pregnancyQueries.getBirthWeightDistribution(postgresql)
      expect(sql).toContain("DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'")
    })
  })

  describe('getAncCompliance', () => {
    it('MUST use monthsAgo helper for MySQL', () => {
      const sql = pregnancyQueries.getAncCompliance(mysql)
      expect(sql).toContain("DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 3 MONTH)")
    })

    it('MUST use monthsAgo helper for PostgreSQL', () => {
      const sql = pregnancyQueries.getAncCompliance(postgresql)
      expect(sql).toContain("DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'")
    })
  })

  describe('getHighRiskPregnancies', () => {
    it('MUST return compatible SQL for both databases', () => {
      const mysqlSql = pregnancyQueries.getHighRiskPregnancies(mysql)
      const pgSql = pregnancyQueries.getHighRiskPregnancies(postgresql)

      // Should be identical - no db-specific syntax
      expect(mysqlSql).toBe(pgSql)
      expect(mysqlSql).toContain('SELECT')
      expect(mysqlSql).toContain("pa.has_risk = 'Y'")
      expect(mysqlSql).toContain('pa.labor_date IS NULL')
    })
  })

  describe('getUpcomingEdc', () => {
    it('MUST use DATEDIFF for MySQL', () => {
      const sql = pregnancyQueries.getUpcomingEdc(mysql)
      expect(sql).toContain('DATEDIFF(pa.edc, CURDATE())')
    })

    it('MUST use INTERVAL subtraction for PostgreSQL', () => {
      const sql = pregnancyQueries.getUpcomingEdc(postgresql)
      expect(sql).toContain('(pa.edc - CURRENT_DATE)::int')
    })

    it('MUST use daysAhead helper for MySQL', () => {
      const sql = pregnancyQueries.getUpcomingEdc(mysql)
      expect(sql).toContain('DATE_ADD(CURDATE(), INTERVAL 30 DAY)')
    })

    it('MUST use daysAhead helper for PostgreSQL', () => {
      const sql = pregnancyQueries.getUpcomingEdc(postgresql)
      expect(sql).toContain("CURRENT_DATE + INTERVAL '30 days'")
    })
  })
})
