// =============================================================================
// NCD Clinic Dashboard domain types (vocabulary: CONTEXT.md)
// =============================================================================

export type DiseaseKey = 'dm' | 'ht'

export type RightsGroupKey = 'uc' | 'ofc' | 'sss' | 'lgo' | 'other'

/** Today's counts for one clinic: นัด / มาตามนัด / ยังไม่มา */
export interface ClinicToday {
  diseaseKey: DiseaseKey
  clinicCode: string
  clinicName: string
  appointments: number
  came: number
  notArrived: number
}

export interface TodaySummary {
  appointments: number
  came: number
  notArrived: number
  clinics: ClinicToday[]
}

export interface PatientClinicVisit {
  clinicCode: string
  clinicName: string
  diseaseKey: DiseaseKey
}

/** One patient with at least one appointment today that has not arrived yet */
export interface NotArrivedPatient {
  hn: string
  patientName: string
  appointmentTime: string | null
  clinics: PatientClinicVisit[]
  doctor: string | null
  notes: string[]
}

export interface AppointmentCounts {
  appointments: number
  came: number
  missed: number
  notArrivedToday: number
  upcoming: number
}

export interface MonthlyClinicRow extends AppointmentCounts {
  month: string
  diseaseKey: DiseaseKey
  clinicCode: string
  clinicName: string
}

export interface MonthlyRightsRow {
  month: string
  rightsGroup: RightsGroupKey
  came: number
}

export interface MonthPoint {
  month: string
  label: string
  isFuture: boolean
}

export type AppointmentPoint = MonthPoint & AppointmentCounts

export interface ClinicInfo {
  clinicCode: string
  clinicName: string
  diseaseKey: DiseaseKey
}

/** A chart series: one clinic, or several folded into "คลินิกอื่น ๆ" (diseaseKey null) */
export interface ClinicSeriesGroup {
  key: string
  label: string
  clinicCodes: string[]
  diseaseKey: DiseaseKey | null
}

export interface ClinicShare extends ClinicSeriesGroup {
  appointments: number
  percentage: number
}

/** What a detail modal is about */
export type DetailSubject =
  | { kind: 'disease'; key: DiseaseKey }
  | { kind: 'clinic'; key: string }
  | { kind: 'rights'; key: RightsGroupKey }
