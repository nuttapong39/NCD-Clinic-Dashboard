// =============================================================================
// Today's NCD appointments: per-clinic summary and not-yet-arrived patients
// =============================================================================

import { parseNumber } from '@/utils/dataParser'
import { diseaseKeyOfCode, diseaseOf, diseaseOrder } from '@/services/ncdCategories'
import type { ClinicToday, NotArrivedPatient, PatientClinicVisit, TodaySummary } from '@/types/ncd'

type RawRow = Record<string, unknown>

function text(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const trimmed = String(value).trim()
  return trimmed === '' ? null : trimmed
}

function count(value: unknown): number {
  return parseNumber(value) ?? 0
}

function byDiseaseThenClinic(a: PatientClinicVisit, b: PatientClinicVisit): number {
  return diseaseOrder(a.diseaseKey) - diseaseOrder(b.diseaseKey) || a.clinicCode.localeCompare(b.clinicCode)
}

function toClinicToday(row: RawRow): ClinicToday | null {
  const diseaseKey = diseaseKeyOfCode(text(row['standard_ncd_code']) ?? '')
  const clinicCode = text(row['local_clinic_code'])
  if (!diseaseKey || !clinicCode) return null
  return {
    diseaseKey,
    clinicCode,
    clinicName: text(row['local_clinic_name']) ?? clinicCode,
    appointments: count(row['appt_today']),
    came: count(row['came']),
    notArrived: count(row['not_arrived']),
  }
}

/** Query 1 rows → totals plus one entry per clinic, DM clinics first. */
export function summarizeToday(rows: readonly RawRow[]): TodaySummary {
  const clinics = rows
    .map(toClinicToday)
    .filter((clinic): clinic is ClinicToday => clinic !== null)
    .sort(byDiseaseThenClinic)
  return {
    appointments: clinics.reduce((sum, clinic) => sum + clinic.appointments, 0),
    came: clinics.reduce((sum, clinic) => sum + clinic.came, 0),
    notArrived: clinics.reduce((sum, clinic) => sum + clinic.notArrived, 0),
    clinics,
  }
}

function isEarlier(time: string | null, than: string | null): boolean {
  if (time === null) return false
  return than === null || time < than
}

/** Query 2 rows (one per appointment) → one row per patient, earliest appointment first. */
export function groupNotArrivedByPatient(rows: readonly RawRow[]): NotArrivedPatient[] {
  const patients = new Map<string, NotArrivedPatient>()

  for (const row of rows) {
    const hn = text(row['hn'])
    const diseaseKey = diseaseKeyOfCode(text(row['standard_ncd_code']) ?? '')
    const clinicCode = text(row['local_clinic_code'])
    if (!hn || !diseaseKey || !clinicCode) continue

    const time = text(row['nexttime'])
    const doctor = text(row['doctor'])
    const note = text(row['note'])
    const clinic = { clinicCode, clinicName: text(row['clinic_name']) ?? clinicCode, diseaseKey }

    const existing = patients.get(hn)
    if (!existing) {
      patients.set(hn, {
        hn,
        patientName: text(row['patient_name']) ?? hn,
        appointmentTime: time,
        clinics: [clinic],
        doctor,
        notes: note ? [note] : [],
      })
      continue
    }

    if (!existing.clinics.some((known) => known.clinicCode === clinicCode)) existing.clinics.push(clinic)
    if (note && !existing.notes.includes(note)) existing.notes.push(note)
    if (isEarlier(time, existing.appointmentTime)) {
      existing.appointmentTime = time
      existing.doctor = doctor
    }
  }

  const result = [...patients.values()]
  for (const patient of result) patient.clinics.sort(byDiseaseThenClinic)
  return result.sort((a, b) => {
    if (a.appointmentTime === b.appointmentTime) return a.hn.localeCompare(b.hn)
    if (a.appointmentTime === null) return 1
    if (b.appointmentTime === null) return -1
    return a.appointmentTime.localeCompare(b.appointmentTime)
  })
}

export interface NotArrivedFilter {
  query: string
  clinicCode: string | null
}

/** Search by HN or name, and/or keep patients with an appointment in one clinic. */
export function filterNotArrived(patients: readonly NotArrivedPatient[], filter: NotArrivedFilter): NotArrivedPatient[] {
  const query = filter.query.trim().toLowerCase()
  return patients.filter(
    (patient) =>
      (filter.clinicCode === null || patient.clinics.some((clinic) => clinic.clinicCode === filter.clinicCode)) &&
      (query === '' || patient.hn.toLowerCase().includes(query) || patient.patientName.toLowerCase().includes(query)),
  )
}

export const NOT_ARRIVED_CSV_COLUMNS = [
  'appointment_time',
  'hn',
  'patient_name',
  'clinics',
  'diseases',
  'doctor',
  'notes',
] as const

export type NotArrivedCsvRow = Record<(typeof NOT_ARRIVED_CSV_COLUMNS)[number], string>

export function notArrivedCsvRows(patients: readonly NotArrivedPatient[]): NotArrivedCsvRow[] {
  return patients.map((patient) => ({
    appointment_time: patient.appointmentTime?.slice(0, 5) ?? '',
    hn: patient.hn,
    patient_name: patient.patientName,
    clinics: patient.clinics.map((clinic) => clinic.clinicName).join('; '),
    diseases: [...new Set(patient.clinics.map((clinic) => diseaseOf(clinic.diseaseKey).shortLabel))].join('; '),
    doctor: patient.doctor ?? '',
    notes: patient.notes.join('; '),
  }))
}
