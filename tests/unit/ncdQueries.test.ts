// tests/unit/ncdQueries.test.ts
import { describe, it, expect } from 'vitest'
import { ncdQueries, NCD_CODES } from '@/services/ncdQueries'
import type { DatabaseType } from '@/types'

describe('ncdQueries', () => {
  const mysql: DatabaseType = 'mysql'
  const postgresql: DatabaseType = 'postgresql'

  describe('getNcdAppointmentSummaryToday', () => {
    it('MUST filter clinics by moph_ncd_code, not local clinic code', () => {
      const sql = ncdQueries.getNcdAppointmentSummaryToday(postgresql)
      expect(sql).toContain('FROM hosxp_clinic_type')
      expect(sql).toContain("moph_ncd_code IN ('001', '002')")
      expect(sql).toContain('c.hosxp_clinic_type_id = tt.hosxp_clinic_type_id')
    })

    it('MUST avoid PostgreSQL-only FILTER clause (MySQL compatible)', () => {
      const sql = ncdQueries.getNcdAppointmentSummaryToday(mysql)
      expect(sql).not.toContain('FILTER (')
      expect(sql).toContain('a.nextdate = CURDATE()')
    })

    it('MUST use CURRENT_DATE for PostgreSQL', () => {
      const sql = ncdQueries.getNcdAppointmentSummaryToday(postgresql)
      expect(sql).toContain('a.nextdate = CURRENT_DATE')
    })

    it('MUST accept a single disease code', () => {
      const sql = ncdQueries.getNcdAppointmentSummaryToday(mysql, [NCD_CODES.HYPERTENSION])
      expect(sql).toContain("moph_ncd_code IN ('002')")
    })
  })

  describe('getNcdMissedAppointmentsToday', () => {
    it('MUST list only not-yet-arrived appointments without a visit', () => {
      const sql = ncdQueries.getNcdMissedAppointmentsToday(postgresql, [NCD_CODES.HYPERTENSION])
      expect(sql).toContain("moph_ncd_code IN ('002')")
      expect(sql).toContain('a.oapp_status_id = 1')
      expect(sql).toContain('NOT EXISTS')
      expect(sql).not.toContain("a.clinic = '002'")
    })

    it('MUST use CONCAT for patient name (works on MySQL and PostgreSQL)', () => {
      const sql = ncdQueries.getNcdMissedAppointmentsToday(mysql)
      expect(sql).toContain("CONCAT(p.pname, p.fname, ' ', p.lname)")
      expect(sql).not.toContain('||')
    })
  })

  describe('input validation', () => {
    it('MUST reject non-numeric codes (SQL injection guard)', () => {
      expect(() => ncdQueries.getNcdMissedAppointmentsToday(mysql, ["002') OR 1=1 --"])).toThrow()
    })

    it('MUST reject empty code list', () => {
      expect(() => ncdQueries.getNcdAppointmentSummaryToday(mysql, [])).toThrow()
    })
  })
})
