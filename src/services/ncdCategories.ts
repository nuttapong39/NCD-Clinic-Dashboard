// =============================================================================
// NCD categories: diseases and rights groups, with their display order
// =============================================================================

import { NCD_CODES } from '@/services/ncdQueries'
import type { ClinicInfo, DiseaseKey, RightsGroupKey } from '@/types/ncd'

export interface DiseaseDefinition {
  key: DiseaseKey
  code: string
  label: string
  shortLabel: string
  description: string
}

export const DISEASES: readonly DiseaseDefinition[] = [
  {
    key: 'dm',
    code: NCD_CODES.DIABETES,
    label: 'เบาหวาน',
    shortLabel: 'DM',
    description: 'นัดในคลินิกที่ประเภทคลินิกเป็นเบาหวาน (รหัส สธ. 001)',
  },
  {
    key: 'ht',
    code: NCD_CODES.HYPERTENSION,
    label: 'ความดันโลหิตสูง',
    shortLabel: 'HT',
    description: 'นัดในคลินิกที่ประเภทคลินิกเป็นความดันโลหิตสูง (รหัส สธ. 002)',
  },
]

export interface RightsGroupDefinition {
  key: RightsGroupKey
  label: string
  hipdataCodes: readonly string[]
}

export const RIGHTS_GROUPS: readonly RightsGroupDefinition[] = [
  { key: 'uc', label: 'UC (บัตรทอง)', hipdataCodes: ['UCS'] },
  { key: 'ofc', label: 'ข้าราชการ', hipdataCodes: ['OFC'] },
  { key: 'sss', label: 'ประกันสังคม', hipdataCodes: ['SSS'] },
  { key: 'lgo', label: 'อปท.', hipdataCodes: ['LGO'] },
  { key: 'other', label: 'อื่น ๆ', hipdataCodes: [] },
]

export function diseaseKeyOfCode(code: string): DiseaseKey | null {
  return DISEASES.find((disease) => disease.code === code)?.key ?? null
}

export function diseaseOf(key: DiseaseKey): DiseaseDefinition {
  const disease = DISEASES.find((candidate) => candidate.key === key)
  if (!disease) throw new Error(`Unknown disease key: ${key}`)
  return disease
}

export function rightsGroupOf(key: RightsGroupKey): RightsGroupDefinition {
  const group = RIGHTS_GROUPS.find((candidate) => candidate.key === key)
  if (!group) throw new Error(`Unknown rights group: ${key}`)
  return group
}

export function rightsGroupKeyOfHipdata(hipdataCode: string | null): RightsGroupKey {
  const normalized = (hipdataCode ?? '').trim().toUpperCase()
  return RIGHTS_GROUPS.find((group) => group.hipdataCodes.includes(normalized))?.key ?? 'other'
}

export function diseaseOrder(key: DiseaseKey): number {
  return DISEASES.findIndex((disease) => disease.key === key)
}

export function rightsGroupOrder(key: RightsGroupKey): number {
  return RIGHTS_GROUPS.findIndex((group) => group.key === key)
}

/** Display order of clinics everywhere: DM clinics first, then by clinic code. */
export function compareClinics(a: ClinicInfo, b: ClinicInfo): number {
  return diseaseOrder(a.diseaseKey) - diseaseOrder(b.diseaseKey) || a.clinicCode.localeCompare(b.clinicCode)
}
