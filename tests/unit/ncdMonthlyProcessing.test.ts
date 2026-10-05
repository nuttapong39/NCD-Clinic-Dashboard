import { describe, it, expect } from 'vitest'
import {
  normalizeMonthlyClinicRows,
  normalizeMonthlyRightsRows,
  buildAppointmentSeries,
  summarizeSeries,
  attendanceRate,
  percentChange,
  listClinics,
  clinicShare,
  clinicSeriesGroups,
  buildClinicStackSeries,
  buildRightsSeries,
  detailSeries,
  monthlyCsvRows,
} from '@/services/ncdMonthlyProcessing'
import type { MonthlyClinicRow, MonthlyRightsRow } from '@/types/ncd'

const TODAY = new Date(2025, 10, 15) // 15 Nov 2025 → fiscal year 2569, 2 months elapsed

function clinicRow(overrides: Partial<MonthlyClinicRow>): MonthlyClinicRow {
  return {
    month: '2025-10',
    diseaseKey: 'dm',
    clinicCode: '010',
    clinicName: 'คลินิกเบาหวาน',
    appointments: 0,
    came: 0,
    missed: 0,
    notArrivedToday: 0,
    upcoming: 0,
    ...overrides,
  }
}

describe('normalizeMonthlyClinicRows', () => {
  it('MUST turn yr/mo into a YYYY-MM month and parse numeric strings', () => {
    const rows = normalizeMonthlyClinicRows([
      { yr: '2025', mo: '1', standard_ncd_code: '002', local_clinic_code: '015', local_clinic_name: 'คลินิกความดัน', appt: '1,200', came: '900', missed: 250, not_arrived_today: 0, upcoming: '50' },
    ])
    expect(rows).toEqual([
      { month: '2025-01', diseaseKey: 'ht', clinicCode: '015', clinicName: 'คลินิกความดัน', appointments: 1200, came: 900, missed: 250, notArrivedToday: 0, upcoming: 50 },
    ])
  })

  it('MUST drop rows without a month or with an unknown disease code', () => {
    const rows = normalizeMonthlyClinicRows([
      { yr: null, mo: 1, standard_ncd_code: '001', local_clinic_code: '010', appt: 5 },
      { yr: 2025, mo: 13, standard_ncd_code: '001', local_clinic_code: '010', appt: 5 },
      { yr: 2025, mo: 1, standard_ncd_code: '777', local_clinic_code: '010', appt: 5 },
    ])
    expect(rows).toEqual([])
  })
})

describe('normalizeMonthlyRightsRows', () => {
  it('MUST map hipdata codes to the five rights groups and merge rows of the same group', () => {
    const rows = normalizeMonthlyRightsRows([
      { yr: 2025, mo: 10, hipdata_code: 'UCS', came: '100' },
      { yr: 2025, mo: 10, hipdata_code: 'ofc', came: 20 },
      { yr: 2025, mo: 10, hipdata_code: 'NRH', came: 3 },
      { yr: 2025, mo: 10, hipdata_code: null, came: 2 },
    ])
    expect(rows).toEqual([
      { month: '2025-10', rightsGroup: 'uc', came: 100 },
      { month: '2025-10', rightsGroup: 'ofc', came: 20 },
      { month: '2025-10', rightsGroup: 'other', came: 5 },
    ])
  })
})

describe('buildAppointmentSeries', () => {
  const rows = [
    clinicRow({ month: '2025-10', appointments: 10, came: 8, missed: 2 }),
    clinicRow({ month: '2025-10', clinicCode: '015', diseaseKey: 'ht', appointments: 5, came: 5 }),
    clinicRow({ month: '2025-11', appointments: 20, came: 9, missed: 3, notArrivedToday: 1, upcoming: 7 }),
    clinicRow({ month: '2024-10', appointments: 99, came: 99 }),
  ]

  it('MUST always return 12 fiscal months with zero for months without data', () => {
    const series = buildAppointmentSeries(rows, 2569, TODAY)
    expect(series).toHaveLength(12)
    expect(series[0]).toMatchObject({ month: '2025-10', label: 'ต.ค. 68', appointments: 15, came: 13, missed: 2 })
    expect(series[2]).toMatchObject({ month: '2025-12', appointments: 0, came: 0 })
  })

  it('MUST flag months after the current month as future', () => {
    const series = buildAppointmentSeries(rows, 2569, TODAY)
    expect(series[1].isFuture).toBe(false)
    expect(series[2].isFuture).toBe(true)
  })

  it('MUST only include rows accepted by the filter', () => {
    const series = buildAppointmentSeries(rows, 2569, TODAY, (row) => row.diseaseKey === 'ht')
    expect(series[0].appointments).toBe(5)
    expect(series[1].appointments).toBe(0)
  })
})

describe('summarizeSeries', () => {
  it('MUST sum only the first n months', () => {
    const series = buildAppointmentSeries(
      [clinicRow({ month: '2025-10', appointments: 10, came: 8, missed: 2 }), clinicRow({ month: '2025-12', appointments: 50, came: 50 })],
      2569,
      TODAY,
    )
    expect(summarizeSeries(series, 2)).toEqual({ appointments: 10, came: 8, missed: 2, notArrivedToday: 0, upcoming: 0 })
  })
})

describe('attendanceRate', () => {
  it('MUST divide came by came plus missed, ignoring not-yet-arrived and upcoming', () => {
    expect(attendanceRate({ appointments: 30, came: 15, missed: 5, notArrivedToday: 4, upcoming: 6 })).toBe(75)
  })

  it('MUST return null when there is nothing due yet', () => {
    expect(attendanceRate({ appointments: 6, came: 0, missed: 0, notArrivedToday: 0, upcoming: 6 })).toBeNull()
  })
})

describe('percentChange', () => {
  it('MUST return the percentage change from the previous value', () => {
    expect(percentChange(115, 100)).toBe(15)
    expect(percentChange(75, 100)).toBe(-25)
  })

  it('MUST return null when the previous value is zero', () => {
    expect(percentChange(10, 0)).toBeNull()
  })
})

describe('listClinics', () => {
  it('MUST list each clinic once, DM clinics first then by clinic code', () => {
    const clinics = listClinics([
      clinicRow({ clinicCode: '015', diseaseKey: 'ht', clinicName: 'ความดัน' }),
      clinicRow({ clinicCode: '021', clinicName: 'เบาหวานบ่าย' }),
      clinicRow({ clinicCode: '010', clinicName: 'เบาหวาน', month: '2025-11' }),
      clinicRow({ clinicCode: '010', clinicName: 'เบาหวาน' }),
    ])
    expect(clinics).toEqual([
      { clinicCode: '010', clinicName: 'เบาหวาน', diseaseKey: 'dm' },
      { clinicCode: '021', clinicName: 'เบาหวานบ่าย', diseaseKey: 'dm' },
      { clinicCode: '015', clinicName: 'ความดัน', diseaseKey: 'ht' },
    ])
  })
})

describe('clinicSeriesGroups', () => {
  const clinics = Array.from({ length: 8 }, (_, index) => ({
    clinicCode: String(index + 1).padStart(3, '0'),
    clinicName: `คลินิก ${index + 1}`,
    diseaseKey: index < 4 ? ('dm' as const) : ('ht' as const),
  }))

  it('MUST give every clinic its own series when there are at most six', () => {
    const groups = clinicSeriesGroups(clinics.slice(0, 6))
    expect(groups).toHaveLength(6)
    expect(groups[0]).toEqual({ key: '001', label: 'คลินิก 1', clinicCodes: ['001'], diseaseKey: 'dm' })
  })

  it('MUST fold clinics beyond the fifth into one "other clinics" series when there are more than six', () => {
    const groups = clinicSeriesGroups(clinics)
    expect(groups).toHaveLength(6)
    expect(groups.slice(0, 5).map((group) => group.key)).toEqual(['001', '002', '003', '004', '005'])
    expect(groups[5]).toEqual({ key: 'other', label: 'คลินิกอื่น ๆ', clinicCodes: ['006', '007', '008'], diseaseKey: null })
  })
})

describe('clinicShare', () => {
  it('MUST give each series its share of the selected fiscal year appointments only', () => {
    const rows = [
      clinicRow({ month: '2025-10', clinicCode: '010', appointments: 30 }),
      clinicRow({ month: '2026-03', clinicCode: '015', diseaseKey: 'ht', clinicName: 'ความดัน', appointments: 10 }),
      clinicRow({ month: '2025-09', clinicCode: '015', diseaseKey: 'ht', clinicName: 'ความดัน', appointments: 500 }),
    ]
    const shares = clinicShare(rows, 2569, clinicSeriesGroups(listClinics(rows)))
    expect(shares).toEqual([
      { key: '010', label: 'คลินิกเบาหวาน', clinicCodes: ['010'], diseaseKey: 'dm', appointments: 30, percentage: 75 },
      { key: '015', label: 'ความดัน', clinicCodes: ['015'], diseaseKey: 'ht', appointments: 10, percentage: 25 },
    ])
  })

  it('MUST leave out series without appointments in the fiscal year', () => {
    const rows = [clinicRow({ month: '2025-10', appointments: 0 })]
    expect(clinicShare(rows, 2569, clinicSeriesGroups(listClinics(rows)))).toEqual([])
  })
})

describe('buildClinicStackSeries', () => {
  it('MUST put each series appointment count, the total and the same month last year on every point', () => {
    const rows = [
      clinicRow({ month: '2025-10', clinicCode: '010', appointments: 30 }),
      clinicRow({ month: '2025-10', clinicCode: '015', diseaseKey: 'ht', appointments: 10 }),
      clinicRow({ month: '2024-10', clinicCode: '010', appointments: 32 }),
    ]
    const series = buildClinicStackSeries(rows, 2569, TODAY, clinicSeriesGroups(listClinics(rows)))
    expect(series).toHaveLength(12)
    expect(series[0]).toMatchObject({ month: '2025-10', isFuture: false, total: 40, previousTotal: 32, '010': 30, '015': 10 })
    expect(series[1]).toMatchObject({ month: '2025-11', total: 0, previousTotal: 0, '010': 0, '015': 0 })
  })

  it('MUST sum folded clinics into the "other" series', () => {
    const rows = Array.from({ length: 7 }, (_, index) =>
      clinicRow({ month: '2025-10', clinicCode: String(index + 1).padStart(3, '0'), appointments: index + 1 }),
    )
    const series = buildClinicStackSeries(rows, 2569, TODAY, clinicSeriesGroups(listClinics(rows)))
    expect(series[0]).toMatchObject({ '005': 5, other: 13, total: 28 })
  })
})

describe('buildRightsSeries', () => {
  it('MUST put each rights group count, the total and the same month last year on every point', () => {
    const rows: MonthlyRightsRow[] = [
      { month: '2025-10', rightsGroup: 'uc', came: 80 },
      { month: '2025-10', rightsGroup: 'sss', came: 20 },
      { month: '2024-10', rightsGroup: 'uc', came: 90 },
    ]
    const series = buildRightsSeries(rows, 2569, TODAY)
    expect(series[0]).toMatchObject({ month: '2025-10', uc: 80, ofc: 0, sss: 20, lgo: 0, other: 0, total: 100, previousTotal: 90 })
  })
})

describe('detailSeries', () => {
  const clinicRows = [
    clinicRow({ month: '2025-10', clinicCode: '010', appointments: 30, came: 25, missed: 5 }),
    clinicRow({ month: '2025-10', clinicCode: '015', diseaseKey: 'ht', appointments: 10, came: 6, missed: 4 }),
    clinicRow({ month: '2024-10', clinicCode: '010', appointments: 20, came: 20 }),
  ]
  const rightsRows: MonthlyRightsRow[] = [
    { month: '2025-10', rightsGroup: 'ofc', came: 7 },
    { month: '2024-10', rightsGroup: 'ofc', came: 3 },
  ]

  it('MUST return the current and previous fiscal year series of a disease', () => {
    const { current, previous } = detailSeries({ kind: 'disease', key: 'dm' }, clinicRows, rightsRows, 2569, TODAY)
    expect(current[0]).toMatchObject({ appointments: 30, came: 25, missed: 5 })
    expect(previous[0]).toMatchObject({ month: '2024-10', appointments: 20, came: 20 })
  })

  it('MUST return the series of a single clinic', () => {
    const { current } = detailSeries({ kind: 'clinic', key: '015' }, clinicRows, rightsRows, 2569, TODAY)
    expect(current[0]).toMatchObject({ appointments: 10, came: 6, missed: 4 })
  })

  it('MUST return attended appointments of a rights group in the came metric', () => {
    const { current, previous } = detailSeries({ kind: 'rights', key: 'ofc' }, clinicRows, rightsRows, 2569, TODAY)
    expect(current[0]).toMatchObject({ came: 7, appointments: 0 })
    expect(previous[0]).toMatchObject({ came: 3 })
  })
})

describe('monthlyCsvRows', () => {
  it('MUST export the selected fiscal year rows ordered by month then clinic with snake_case columns', () => {
    const rows = monthlyCsvRows(
      [
        clinicRow({ month: '2025-11', clinicCode: '010', appointments: 3, came: 2, missed: 1 }),
        clinicRow({ month: '2025-10', clinicCode: '015', diseaseKey: 'ht', clinicName: 'ความดัน', appointments: 4, came: 4 }),
        clinicRow({ month: '2025-10', clinicCode: '010', appointments: 5, came: 5 }),
        clinicRow({ month: '2024-10', clinicCode: '010', appointments: 9 }),
      ],
      2569,
    )
    expect(rows.map((row) => `${row.month}/${row.local_clinic_code}`)).toEqual(['2025-10/010', '2025-10/015', '2025-11/010'])
    expect(rows[2]).toEqual({
      month: '2025-11',
      disease: 'DM',
      local_clinic_code: '010',
      local_clinic_name: 'คลินิกเบาหวาน',
      appointments: 3,
      came: 2,
      missed: 1,
      not_arrived_today: 0,
      upcoming: 0,
      attendance_rate: 66.7,
    })
  })
})
