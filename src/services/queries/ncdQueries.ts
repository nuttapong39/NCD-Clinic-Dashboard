// src/services/queries/ncdQueries.ts
// =============================================================================
// NCD (เบาหวาน / ความดันโลหิตสูง) appointment SQL Query Generators
//
// เลือกคลินิกจากรหัสกลาง สธ. (hosxp_clinic_type.moph_ncd_code)
// แทนรหัส clinic ภายในของแต่ละ รพ. จึงใช้ได้ทุก รพ. โดยไม่ต้องแก้รหัส
// =============================================================================

import type { DatabaseType } from '@/types'
import { currentDateString } from './queryHelpers'

/** รหัสโรค NCD มาตรฐาน สธ. */
export const NCD_CODES = {
  DIABETES: '001',     // เบาหวาน
  HYPERTENSION: '002', // ความดันโลหิตสูง
} as const

export type NcdCode = (typeof NCD_CODES)[keyof typeof NCD_CODES]

const DEFAULT_NCD_CODES: readonly string[] = [NCD_CODES.DIABETES, NCD_CODES.HYPERTENSION]

/**
 * แปลงรายการรหัสโรคเป็น SQL IN-list อย่างปลอดภัย
 * รับเฉพาะรหัสตัวเลข 3 หลัก ป้องกัน SQL injection
 */
function ncdCodeList(codes: readonly string[]): string {
  if (codes.length === 0) {
    throw new Error('ต้องระบุรหัส moph_ncd_code อย่างน้อย 1 รหัส')
  }
  for (const code of codes) {
    if (!/^\d{3}$/.test(code)) {
      throw new Error(`รหัส moph_ncd_code ไม่ถูกต้อง: ${code}`)
    }
  }
  return codes.map((c) => `'${c}'`).join(', ')
}

function targetTypesCte(codes: readonly string[]): string {
  return `
    WITH target_types AS (
      -- จับจากรหัส สธ. กลาง ไม่ใช่รหัส clinic ของ รพ.
      SELECT hosxp_clinic_type_id, hosxp_clinic_type_name, moph_ncd_code
      FROM hosxp_clinic_type
      WHERE moph_ncd_code IN (${ncdCodeList(codes)})
    )`
}

/**
 * Query 1: สรุปนัดวันนี้ แยกตามโรคและคลินิกของ รพ.
 * คอลัมน์: standard_ncd_code, disease_name, local_clinic_code, local_clinic_name,
 *          appt_today, came, missed
 */
export function getNcdAppointmentSummaryToday(
  dbType: DatabaseType,
  codes: readonly string[] = DEFAULT_NCD_CODES,
): string {
  const today = currentDateString(dbType)
  return `
    ${targetTypesCte(codes).trim()}
    SELECT
      tt.moph_ncd_code          AS standard_ncd_code,
      tt.hosxp_clinic_type_name AS disease_name,
      c.clinic                  AS local_clinic_code,
      c.name                    AS local_clinic_name,
      COUNT(a.oapp_id)          AS appt_today,
      COUNT(CASE WHEN a.oapp_status_id = 2 THEN 1 END) AS came,
      COUNT(CASE WHEN a.oapp_status_id = 1
                  AND NOT EXISTS (SELECT 1 FROM ovst o
                                  WHERE o.hn = a.hn AND o.vstdate = a.nextdate)
                 THEN 1 END)    AS missed
    FROM target_types tt
    JOIN clinic c ON c.hosxp_clinic_type_id = tt.hosxp_clinic_type_id
    LEFT JOIN oapp a ON a.clinic = c.clinic AND a.nextdate = ${today}
    GROUP BY tt.moph_ncd_code, tt.hosxp_clinic_type_name, c.clinic, c.name
    ORDER BY tt.moph_ncd_code, c.clinic
  `.trim()
}

/**
 * Query 2: รายชื่อผู้ป่วยที่มีนัดวันนี้แต่ยังไม่มา (ไม่มี visit ใน ovst)
 * คอลัมน์: standard_ncd_code, disease_name, oapp_id, hn, patient_name, nextdate,
 *          nexttime, local_clinic_code, clinic_name, doctor, note
 */
export function getNcdMissedAppointmentsToday(
  dbType: DatabaseType,
  codes: readonly string[] = DEFAULT_NCD_CODES,
): string {
  const today = currentDateString(dbType)
  return `
    ${targetTypesCte(codes).trim()}
    SELECT
      tt.moph_ncd_code          AS standard_ncd_code,
      tt.hosxp_clinic_type_name AS disease_name,
      a.oapp_id,
      a.hn,
      CONCAT(p.pname, p.fname, ' ', p.lname) AS patient_name,
      a.nextdate,
      a.nexttime,
      c.clinic                  AS local_clinic_code,
      c.name                    AS clinic_name,
      a.doctor,
      a.note
    FROM target_types tt
    JOIN clinic  c ON c.hosxp_clinic_type_id = tt.hosxp_clinic_type_id
    JOIN oapp    a ON a.clinic = c.clinic
    JOIN patient p ON p.hn = a.hn
    WHERE a.nextdate = ${today}
      AND a.oapp_status_id = 1 -- ยังไม่มา
      AND NOT EXISTS (
        SELECT 1 FROM ovst o
        WHERE o.hn = a.hn AND o.vstdate = a.nextdate
      )
    ORDER BY tt.moph_ncd_code, a.nexttime, a.hn
  `.trim()
}
