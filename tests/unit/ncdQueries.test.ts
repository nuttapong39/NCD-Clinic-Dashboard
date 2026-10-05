// tests/unit/ncdQueries.test.ts
import { describe, it, expect } from 'vitest'
import { ncdQueries, NCD_CODES, NOT_ARRIVED_LIST_LIMIT } from '@/services/ncdQueries'
import type { DatabaseType } from '@/types'

const ATTENDED_BY_VISIT = /EXISTS \(\s*SELECT 1 FROM ovst o\s+WHERE o\.hn = a\.hn AND o\.vstdate = a\.nextdate\s*\)/

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

    it('MUST cap the clinic rows with a LIMIT', () => {
      const sql = ncdQueries.getNcdAppointmentSummaryToday(mysql)
      expect(sql).toMatch(/LIMIT \d+$/)
    })

    it('MUST accept a single disease code', () => {
      const sql = ncdQueries.getNcdAppointmentSummaryToday(mysql, [NCD_CODES.HYPERTENSION])
      expect(sql).toContain("moph_ncd_code IN ('002')")
    })

    it('MUST exclude cancelled appointments inside the LEFT JOIN so empty clinics still return zero', () => {
      const sql = ncdQueries.getNcdAppointmentSummaryToday(mysql)
      expect(sql).toMatch(/LEFT JOIN oapp a ON a\.clinic = c\.clinic\s+AND a\.nextdate = CURDATE\(\)\s+AND a\.oapp_status_id IN \(1, 2\)/)
    })

    it('MUST decide attendance from a visit on the appointment date, not the appointment status', () => {
      const sql = ncdQueries.getNcdAppointmentSummaryToday(postgresql)
      expect(sql).toMatch(ATTENDED_BY_VISIT)
      expect(sql).not.toContain('oapp_status_id = 2')
      expect(sql).toContain('AS came')
      expect(sql).toContain('AS not_arrived')
    })
  })

  describe('getNcdNotArrivedAppointmentsToday', () => {
    it('MUST list only counted appointments without a visit', () => {
      const sql = ncdQueries.getNcdNotArrivedAppointmentsToday(postgresql, [NCD_CODES.HYPERTENSION])
      expect(sql).toContain("moph_ncd_code IN ('002')")
      expect(sql).toContain('a.oapp_status_id IN (1, 2)')
      expect(sql).toMatch(new RegExp(`NOT ${ATTENDED_BY_VISIT.source}`))
      expect(sql).not.toContain("a.clinic = '002'")
    })

    it('MUST use CONCAT for patient name (works on MySQL and PostgreSQL)', () => {
      const sql = ncdQueries.getNcdNotArrivedAppointmentsToday(mysql)
      expect(sql).toContain("CONCAT(p.pname, p.fname, ' ', p.lname)")
      expect(sql).not.toContain('||')
    })

    it('MUST cap the patient list with a LIMIT', () => {
      const sql = ncdQueries.getNcdNotArrivedAppointmentsToday(mysql)
      expect(NOT_ARRIVED_LIST_LIMIT).toBe(1000)
      expect(sql).toMatch(/LIMIT 1000$/)
    })
  })

  describe('getNcdMonthlyAppointmentsByClinic', () => {
    it('MUST bind the date range as :start_date and :end_date parameters', () => {
      const sql = ncdQueries.getNcdMonthlyAppointmentsByClinic(postgresql)
      expect(sql).toContain('a.nextdate BETWEEN :start_date AND :end_date')
    })

    it('MUST group months with EXTRACT instead of database-specific date formatting', () => {
      for (const dbType of [mysql, postgresql]) {
        const sql = ncdQueries.getNcdMonthlyAppointmentsByClinic(dbType)
        expect(sql).toContain('EXTRACT(YEAR FROM ap.nextdate) AS yr')
        expect(sql).toContain('EXTRACT(MONTH FROM ap.nextdate) AS mo')
        expect(sql).not.toContain('TO_CHAR')
        expect(sql).not.toContain('DATE_FORMAT')
      }
    })

    it('MUST classify each appointment as came, missed, not arrived today or upcoming relative to today', () => {
      const sql = ncdQueries.getNcdMonthlyAppointmentsByClinic(mysql)
      expect(sql).toMatch(ATTENDED_BY_VISIT)
      expect(sql).toContain('ap.nextdate < CURDATE() THEN 1 ELSE 0 END) AS missed')
      expect(sql).toContain('ap.nextdate = CURDATE() THEN 1 ELSE 0 END) AS not_arrived_today')
      expect(sql).toContain('ap.nextdate > CURDATE() THEN 1 ELSE 0 END) AS upcoming')
    })

    it('MUST group by disease and local clinic with counted statuses only and a LIMIT', () => {
      const sql = ncdQueries.getNcdMonthlyAppointmentsByClinic(postgresql)
      expect(sql).toContain('a.oapp_status_id IN (1, 2)')
      expect(sql).toContain('AS standard_ncd_code')
      expect(sql).toContain('AS local_clinic_code')
      expect(sql).toContain('AS local_clinic_name')
      expect(sql).toMatch(/LIMIT \d+$/)
    })
  })

  describe('getNcdMonthlyAttendedByRightsGroup', () => {
    it('MUST count attended appointments by the hipdata code of the visit rights', () => {
      const sql = ncdQueries.getNcdMonthlyAttendedByRightsGroup(postgresql)
      expect(sql).toContain('a.nextdate BETWEEN :start_date AND :end_date')
      expect(sql).toContain('JOIN ovst o ON o.vn = att.vn')
      expect(sql).toContain('LEFT JOIN pttype pt ON pt.pttype = o.pttype')
      expect(sql).toContain('pt.hipdata_code')
      expect(sql).toContain('EXTRACT(MONTH FROM att.nextdate) AS mo')
      expect(sql).toMatch(/LIMIT \d+$/)
    })

    it('MUST use a single visit per appointment when the patient has several visits that day', () => {
      const sql = ncdQueries.getNcdMonthlyAttendedByRightsGroup(mysql)
      expect(sql).toMatch(/SELECT MIN\(o\.vn\) FROM ovst o\s+WHERE o\.hn = a\.hn AND o\.vstdate = a\.nextdate/)
    })
  })

  describe('input validation', () => {
    it('MUST reject non-numeric codes (SQL injection guard)', () => {
      expect(() => ncdQueries.getNcdNotArrivedAppointmentsToday(mysql, ["002') OR 1=1 --"])).toThrow()
      expect(() => ncdQueries.getNcdMonthlyAppointmentsByClinic(mysql, ["1' --"])).toThrow()
      expect(() => ncdQueries.getNcdMonthlyAttendedByRightsGroup(mysql, ['abc'])).toThrow()
    })

    it('MUST reject empty code list', () => {
      expect(() => ncdQueries.getNcdAppointmentSummaryToday(mysql, [])).toThrow()
    })
  })
})
