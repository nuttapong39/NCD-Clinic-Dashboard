import { describe, it, expect } from 'vitest'
import { monthlyExport, notArrivedExport } from '@/services/ncdExports'
import { groupNotArrivedByPatient } from '@/services/ncdTodayProcessing'
import type { MonthlyClinicRow } from '@/types/ncd'

const BOM = '﻿'

describe('monthlyExport', () => {
  it('MUST name the file after the fiscal year and write the monthly columns', () => {
    const rows: MonthlyClinicRow[] = [
      { month: '2025-10', diseaseKey: 'dm', clinicCode: '010', clinicName: 'คลินิกเบาหวาน', appointments: 10, came: 8, missed: 2, notArrivedToday: 0, upcoming: 0 },
    ]
    const file = monthlyExport(rows, 2569)
    expect(file.filename).toBe('ncd-clinic-fy2569.csv')
    expect(file.csv.startsWith(`${BOM}month,disease,local_clinic_code`)).toBe(true)
    expect(file.csv).toContain('2025-10,DM,010,คลินิกเบาหวาน,10,8,2,0,0,80')
  })
})

describe('notArrivedExport', () => {
  it('MUST name the file after the local date of the list', () => {
    const patients = groupNotArrivedByPatient([
      { standard_ncd_code: '001', hn: '000123', patient_name: 'นายสมชาย ใจดี', nexttime: '08:00:00', local_clinic_code: '010', clinic_name: 'คลินิกเบาหวาน' },
    ])
    const file = notArrivedExport(patients, new Date(2026, 9, 5, 1, 15))
    expect(file.filename).toBe('ncd-not-arrived-2026-10-05.csv')
    expect(file.csv).toContain('08:00,000123,นายสมชาย ใจดี,คลินิกเบาหวาน,DM,,')
  })
})
