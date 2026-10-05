// =============================================================================
// Category colours and icons — one category, one colour, everywhere (UI-TEMPLATE §7.4)
// Series colours are CVD-validated (dataviz validate_palette.js) and assigned in a
// fixed order. Blue/orange belong to DM/HT only; clinics and rights groups never
// use them (ADR-0003). There are never more than MAX_CLINIC_SERIES clinic series.
// =============================================================================

import type { LucideIcon } from 'lucide-react'
import { Activity, Droplet, HeartPulse } from 'lucide-react'
import { OTHER_CLINICS_KEY } from '@/services/ncdMonthlyProcessing'
import type { DiseaseKey, RightsGroupKey } from '@/types/ncd'

export interface Visual {
  icon: LucideIcon
  color: string
  tile: string
  dot: string
}

export const TOTAL_VISUAL: Visual = {
  icon: Activity,
  color: 'hsl(var(--primary))',
  tile: 'bg-linear-to-br from-teal-500 to-sky-500 text-white shadow-[0_8px_20px_-8px_rgb(13_148_136/0.6)]',
  dot: 'bg-primary',
}

export const DISEASE_VISUALS: Record<DiseaseKey, Visual> = {
  dm: { icon: Droplet, color: 'hsl(var(--cat-1))', tile: 'bg-blue-50 text-blue-600 ring-1 ring-blue-100', dot: 'bg-cat-1' },
  ht: { icon: HeartPulse, color: 'hsl(var(--cat-2))', tile: 'bg-orange-50 text-orange-600 ring-1 ring-orange-100', dot: 'bg-cat-2' },
}

/** Series colours for clinics and rights groups — never the DM/HT colours */
const SERIES_COLORS = [
  'hsl(var(--cat-3))',
  'hsl(var(--cat-4))',
  'hsl(var(--cat-5))',
  'hsl(var(--cat-6))',
  'hsl(var(--cat-7))',
] as const

const OTHER_COLOR = 'hsl(220 9% 70%)'

/** Colour of a clinic series by its fixed display position; "other clinics" is neutral grey. */
export function clinicSeriesColor(index: number, key: string): string {
  return key === OTHER_CLINICS_KEY ? OTHER_COLOR : SERIES_COLORS[index] ?? OTHER_COLOR
}

export const RIGHTS_COLORS: Record<RightsGroupKey, string> = {
  uc: SERIES_COLORS[0],
  ofc: SERIES_COLORS[1],
  sss: SERIES_COLORS[2],
  lgo: SERIES_COLORS[3],
  other: OTHER_COLOR,
}

export const PREVIOUS_YEAR_COLOR = 'hsl(var(--muted-foreground))'
