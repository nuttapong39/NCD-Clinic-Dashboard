import { describe, it, expect } from 'vitest'
import { summarizeToday, groupNotArrivedByPatient } from '@/services/ncdTodayProcessing'

describe('summarizeToday', () => {
  const rows = [
    { standard_ncd_code: '002', disease_name: 'ความดัน', local_clinic_code: '015', local_clinic_name: 'คลินิกความดัน', appt_today: '12', came: '7', not_arrived: '5' },
    { standard_ncd_code: '001', disease_name: 'เบาหวาน', local_clinic_code: '021', local_clinic_name: 'คลินิกเบาหวาน บ่าย', appt_today: 3, came: 3, not_arrived: 0 },
    { standard_ncd_code: '001', disease_name: 'เบาหวาน', local_clinic_code: '010', local_clinic_name: 'คลินิกเบาหวาน', appt_today: '1,020', came: '1,000', not_arrived: '20' },
  ]

  it('MUST total appointments, came and not-arrived across all clinics', () => {
    const summary = summarizeToday(rows)
    expect(summary.appointments).toBe(1035)
    expect(summary.came).toBe(1010)
    expect(summary.notArrived).toBe(25)
  })

  it('MUST order clinics by disease (DM before HT) then clinic code', () => {
    const summary = summarizeToday(rows)
    expect(summary.clinics.map((clinic) => clinic.clinicCode)).toEqual(['010', '021', '015'])
    expect(summary.clinics[0]).toEqual({
      diseaseKey: 'dm',
      clinicCode: '010',
      clinicName: 'คลินิกเบาหวาน',
      appointments: 1020,
      came: 1000,
      notArrived: 20,
    })
  })

  it('MUST keep clinics with zero appointments so every clinic gets a card', () => {
    const summary = summarizeToday([
      { standard_ncd_code: '001', local_clinic_code: '010', local_clinic_name: 'A', appt_today: 0, came: 0, not_arrived: 0 },
    ])
    expect(summary.clinics).toHaveLength(1)
    expect(summary.appointments).toBe(0)
  })

  it('MUST drop rows with an unknown disease code or no clinic code', () => {
    const summary = summarizeToday([
      { standard_ncd_code: '009', local_clinic_code: '010', local_clinic_name: 'A', appt_today: 5, came: 5, not_arrived: 0 },
      { standard_ncd_code: '001', local_clinic_code: null, local_clinic_name: 'B', appt_today: 5, came: 5, not_arrived: 0 },
    ])
    expect(summary.clinics).toEqual([])
    expect(summary.appointments).toBe(0)
  })
})

describe('groupNotArrivedByPatient', () => {
  const rows = [
    { standard_ncd_code: '002', oapp_id: 2, hn: '000123', patient_name: 'นายสมชาย ใจดี', nexttime: '10:30:00', local_clinic_code: '015', clinic_name: 'คลินิกความดัน', doctor: 'D01', note: 'งดน้ำงดอาหาร' },
    { standard_ncd_code: '001', oapp_id: 1, hn: '000123', patient_name: 'นายสมชาย ใจดี', nexttime: '08:00:00', local_clinic_code: '010', clinic_name: 'คลินิกเบาหวาน', doctor: 'D02', note: null },
    { standard_ncd_code: '001', oapp_id: 3, hn: '000456', patient_name: 'นางสมศรี มีสุข', nexttime: null, local_clinic_code: '010', clinic_name: 'คลินิกเบาหวาน', doctor: null, note: '' },
  ]

  it('MUST merge appointments of the same patient into one row listing every clinic', () => {
    const patients = groupNotArrivedByPatient(rows)
    expect(patients).toHaveLength(2)
    const somchai = patients.find((patient) => patient.hn === '000123')
    expect(somchai?.clinics).toEqual([
      { clinicCode: '010', clinicName: 'คลินิกเบาหวาน', diseaseKey: 'dm' },
      { clinicCode: '015', clinicName: 'คลินิกความดัน', diseaseKey: 'ht' },
    ])
  })

  it('MUST use the earliest appointment time and its doctor for a merged patient', () => {
    const somchai = groupNotArrivedByPatient(rows).find((patient) => patient.hn === '000123')
    expect(somchai?.appointmentTime).toBe('08:00:00')
    expect(somchai?.doctor).toBe('D02')
  })

  it('MUST keep only non-empty notes', () => {
    const patients = groupNotArrivedByPatient(rows)
    expect(patients.find((patient) => patient.hn === '000123')?.notes).toEqual(['งดน้ำงดอาหาร'])
    expect(patients.find((patient) => patient.hn === '000456')?.notes).toEqual([])
  })

  it('MUST order patients by appointment time with untimed appointments last', () => {
    const patients = groupNotArrivedByPatient([
      ...rows,
      { standard_ncd_code: '001', oapp_id: 4, hn: '000789', patient_name: 'นายมา ก่อน', nexttime: '07:00:00', local_clinic_code: '010', clinic_name: 'คลินิกเบาหวาน', doctor: null, note: null },
    ])
    expect(patients.map((patient) => patient.hn)).toEqual(['000789', '000123', '000456'])
  })
})
