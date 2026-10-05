// src/services/queries/ncdQueries.ts
// =============================================================================
// NCD (เบาหวาน / ความดันโลหิตสูง) appointment SQL Query Generators
//
// เลือกคลินิกจากรหัสกลาง สธ. (hosxp_clinic_type.moph_ncd_code)
// แทนรหัส clinic ภายในของแต่ละ รพ. จึงใช้ได้ทุก รพ. โดยไม่ต้องแก้รหัส
//
// มาตามนัด = มี visit ใน ovst ตรงวันนัด (ADR-0002)
// นับเฉพาะนัดที่ไม่ถูกยกเลิก: oapp_status_id ใน NCD_COUNTED_OAPP_STATUS
// =============================================================================

import type { DatabaseType } from '@/types'
import { currentDateString } from './queryHelpers'

/** รหัสโรค NCD มาตรฐาน สธ. */
export const NCD_CODES = {
  DIABETES: '001',     // เบาหวาน
  HYPERTENSION: '002', // ความดันโลหิตสูง
} as const

export type NcdCode = (typeof NCD_CODES)[keyof typeof NCD_CODES]

/** สถานะนัดที่นับ: 1 = นัดรอมา, 2 = มาตามนัด (สถานะอื่นคือยกเลิก/เลื่อน — รอ IT ยืนยัน) */
export const NCD_COUNTED_OAPP_STATUS = [1, 2] as const

/** จำนวนแถวสูงสุดของรายชื่อผู้ป่วยที่ยังไม่มา */
export const MISSED_LIST_LIMIT = 1000

/** จำนวนคลินิกสูงสุดในสรุปนัดวันนี้ */
const CLINIC_ROW_LIMIT = 500

/** จำนวนแถวสูงสุดของข้อมูลรายเดือน (24 เดือน × คลินิก/กลุ่มสิทธิ) */
const MONTHLY_ROW_LIMIT = 5000

const DEFAULT_NCD_CODES: readonly string[] = [NCD_CODES.DIABETES, NCD_CODES.HYPERTENSION]

const COUNTED_STATUS_LIST = NCD_COUNTED_OAPP_STATUS.join(', ')

const ATTENDED_ON_APPOINTMENT_DATE = `EXISTS (
        SELECT 1 FROM ovst o
        WHERE o.hn = a.hn AND o.vstdate = a.nextdate
      )`

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
  return `WITH target_types AS (
      -- จับจากรหัส สธ. กลาง ไม่ใช่รหัส clinic ของ รพ.
      SELECT hosxp_clinic_type_id, hosxp_clinic_type_name, moph_ncd_code
      FROM hosxp_clinic_type
      WHERE moph_ncd_code IN (${ncdCodeList(codes)})
    )`
}

/**
 * Query 1: สรุปนัดวันนี้ แยกตามโรคและคลินิกของ รพ.
 * คอลัมน์: standard_ncd_code, disease_name, local_clinic_code, local_clinic_name,
 *          appt_today, came, not_arrived
 */
export function getNcdAppointmentSummaryToday(
  dbType: DatabaseType,
  codes: readonly string[] = DEFAULT_NCD_CODES,
): string {
  const today = currentDateString(dbType)
  return `
    ${targetTypesCte(codes)}
    SELECT
      tt.moph_ncd_code          AS standard_ncd_code,
      tt.hosxp_clinic_type_name AS disease_name,
      c.clinic                  AS local_clinic_code,
      c.name                    AS local_clinic_name,
      COUNT(a.oapp_id)          AS appt_today,
      COUNT(CASE WHEN ${ATTENDED_ON_APPOINTMENT_DATE} THEN 1 END) AS came,
      COUNT(CASE WHEN a.oapp_id IS NOT NULL AND NOT ${ATTENDED_ON_APPOINTMENT_DATE} THEN 1 END) AS not_arrived
    FROM target_types tt
    JOIN clinic c ON c.hosxp_clinic_type_id = tt.hosxp_clinic_type_id
    LEFT JOIN oapp a ON a.clinic = c.clinic
      AND a.nextdate = ${today}
      AND a.oapp_status_id IN (${COUNTED_STATUS_LIST})
    GROUP BY tt.moph_ncd_code, tt.hosxp_clinic_type_name, c.clinic, c.name
    ORDER BY tt.moph_ncd_code, c.clinic
    LIMIT ${CLINIC_ROW_LIMIT}
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
    ${targetTypesCte(codes)}
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
      AND a.oapp_status_id IN (${COUNTED_STATUS_LIST})
      AND NOT ${ATTENDED_ON_APPOINTMENT_DATE}
    ORDER BY tt.moph_ncd_code, a.nexttime, a.hn
    LIMIT ${MISSED_LIST_LIMIT}
  `.trim()
}

/**
 * Query 3: นัดรายเดือน แยกตามโรคและคลินิก ในช่วง :start_date – :end_date
 * คอลัมน์: yr, mo, standard_ncd_code, local_clinic_code, local_clinic_name,
 *          appt, came, missed, not_arrived_today, upcoming
 */
export function getNcdMonthlyAppointmentsByClinic(
  dbType: DatabaseType,
  codes: readonly string[] = DEFAULT_NCD_CODES,
): string {
  const today = currentDateString(dbType)
  return `
    ${targetTypesCte(codes)},
    appointments AS (
      SELECT
        tt.moph_ncd_code,
        c.clinic,
        c.name,
        a.nextdate,
        CASE WHEN ${ATTENDED_ON_APPOINTMENT_DATE} THEN 1 ELSE 0 END AS attended
      FROM target_types tt
      JOIN clinic c ON c.hosxp_clinic_type_id = tt.hosxp_clinic_type_id
      JOIN oapp   a ON a.clinic = c.clinic
      WHERE a.nextdate BETWEEN :start_date AND :end_date
        AND a.oapp_status_id IN (${COUNTED_STATUS_LIST})
    )
    SELECT
      EXTRACT(YEAR FROM ap.nextdate) AS yr,
      EXTRACT(MONTH FROM ap.nextdate) AS mo,
      ap.moph_ncd_code AS standard_ncd_code,
      ap.clinic        AS local_clinic_code,
      ap.name          AS local_clinic_name,
      COUNT(*)         AS appt,
      SUM(ap.attended) AS came,
      SUM(CASE WHEN ap.attended = 0 AND ap.nextdate < ${today} THEN 1 ELSE 0 END) AS missed,
      SUM(CASE WHEN ap.attended = 0 AND ap.nextdate = ${today} THEN 1 ELSE 0 END) AS not_arrived_today,
      SUM(CASE WHEN ap.attended = 0 AND ap.nextdate > ${today} THEN 1 ELSE 0 END) AS upcoming
    FROM appointments ap
    GROUP BY EXTRACT(YEAR FROM ap.nextdate), EXTRACT(MONTH FROM ap.nextdate),
             ap.moph_ncd_code, ap.clinic, ap.name
    ORDER BY yr, mo, standard_ncd_code, local_clinic_code
    LIMIT ${MONTHLY_ROW_LIMIT}
  `.trim()
}

/**
 * Query 4: นัดที่มาตามนัดรายเดือน แยกตาม hipdata_code ของสิทธิที่ใช้ใน visit นั้น
 * คอลัมน์: yr, mo, hipdata_code, came
 */
export function getNcdMonthlyAttendedByRightsGroup(
  _dbType: DatabaseType,
  codes: readonly string[] = DEFAULT_NCD_CODES,
): string {
  return `
    ${targetTypesCte(codes)},
    attended AS (
      SELECT
        a.nextdate,
        (SELECT MIN(o.vn) FROM ovst o
         WHERE o.hn = a.hn AND o.vstdate = a.nextdate) AS vn
      FROM target_types tt
      JOIN clinic c ON c.hosxp_clinic_type_id = tt.hosxp_clinic_type_id
      JOIN oapp   a ON a.clinic = c.clinic
      WHERE a.nextdate BETWEEN :start_date AND :end_date
        AND a.oapp_status_id IN (${COUNTED_STATUS_LIST})
    )
    SELECT
      EXTRACT(YEAR FROM att.nextdate) AS yr,
      EXTRACT(MONTH FROM att.nextdate) AS mo,
      pt.hipdata_code,
      COUNT(*) AS came
    FROM attended att
    JOIN ovst o ON o.vn = att.vn
    LEFT JOIN pttype pt ON pt.pttype = o.pttype
    GROUP BY EXTRACT(YEAR FROM att.nextdate), EXTRACT(MONTH FROM att.nextdate), pt.hipdata_code
    ORDER BY yr, mo
    LIMIT ${MONTHLY_ROW_LIMIT}
  `.trim()
}
