// =============================================================================
// Category colours and icons — one category, one colour, everywhere (UI-TEMPLATE §7.4)
// =============================================================================

import type { LucideIcon } from 'lucide-react'
import { Activity, Droplet, HeartPulse, Hospital } from 'lucide-react'
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
  dm: { icon: Droplet, color: 'hsl(var(--cat-1))', tile: 'bg-sky-50 text-sky-600 ring-1 ring-sky-100', dot: 'bg-cat-1' },
  ht: { icon: HeartPulse, color: 'hsl(var(--cat-2))', tile: 'bg-indigo-50 text-indigo-500 ring-1 ring-indigo-100', dot: 'bg-cat-2' },
}

/** Series palette for clinics (cycled by display order). */
const SERIES_PALETTE: readonly Omit<Visual, 'icon'>[] = [
  { color: 'hsl(var(--cat-1))', tile: 'bg-sky-50 text-sky-600 ring-1 ring-sky-100', dot: 'bg-cat-1' },
  { color: 'hsl(var(--cat-2))', tile: 'bg-indigo-50 text-indigo-500 ring-1 ring-indigo-100', dot: 'bg-cat-2' },
  { color: 'hsl(var(--cat-3))', tile: 'bg-teal-50 text-teal-600 ring-1 ring-teal-100', dot: 'bg-cat-3' },
  { color: 'hsl(var(--cat-4))', tile: 'bg-violet-50 text-violet-500 ring-1 ring-violet-100', dot: 'bg-cat-4' },
  { color: 'hsl(var(--cat-5))', tile: 'bg-amber-50 text-amber-600 ring-1 ring-amber-100', dot: 'bg-cat-5' },
  { color: 'hsl(var(--cat-6))', tile: 'bg-rose-50 text-rose-500 ring-1 ring-rose-100', dot: 'bg-cat-6' },
]

export function clinicVisual(index: number): Visual {
  return { icon: Hospital, ...SERIES_PALETTE[index % SERIES_PALETTE.length] }
}

export const RIGHTS_COLORS: Record<RightsGroupKey, string> = {
  uc: 'hsl(var(--cat-1))',
  ofc: 'hsl(var(--cat-2))',
  sss: 'hsl(var(--cat-3))',
  lgo: 'hsl(var(--cat-4))',
  other: 'hsl(220 9% 70%)',
}

export const PREVIOUS_YEAR_COLOR = 'hsl(var(--muted-foreground))'
