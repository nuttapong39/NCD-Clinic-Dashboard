// src/components/pregnancy/KpiCard.tsx
import { Baby, CalendarPlus, Clock, Heart, Activity, AlertTriangle, Shield, CheckCircle, CalendarCheck, ClipboardCheck, Scale, Timer, HeartPulse, Skull } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'
import { formatKpiValue, buildKpiTooltipText } from '@/utils/formatters'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KpiCardProps {
  title: string
  value: number | null
  icon: string
  color: 'rose' | 'blue' | 'amber' | 'emerald' | 'purple' | 'red' | 'teal' | 'indigo' | 'green' | 'cyan' | 'orange' | 'pink' | 'yellow' | 'slate'
  format: 'number' | 'percentage'
  loading?: boolean
  dataSource?: string
  description?: string
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right'
  onClick?: () => void
}

// ---------------------------------------------------------------------------
// Icon Map
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  Baby,
  CalendarPlus,
  Clock,
  Heart,
  Activity,
  AlertTriangle,
  Shield,
  CheckCircle,
  CalendarCheck,
  ClipboardCheck,
  Scale,
  Timer,
  HeartPulse,
  Skull,
}

// ---------------------------------------------------------------------------
// Color Classes Map
// ---------------------------------------------------------------------------

const COLOR_CLASSES: Record<string, { bg: string; icon: string; text: string }> = {
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    icon: 'bg-rose-100 dark:bg-rose-900/50',
    text: 'text-rose-600 dark:text-rose-400',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    icon: 'bg-blue-100 dark:bg-blue-900/50',
    text: 'text-blue-600 dark:text-blue-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: 'bg-amber-100 dark:bg-amber-900/50',
    text: 'text-amber-600 dark:text-amber-400',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: 'bg-emerald-100 dark:bg-emerald-900/50',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    icon: 'bg-purple-100 dark:bg-purple-900/50',
    text: 'text-purple-600 dark:text-purple-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    icon: 'bg-red-100 dark:bg-red-900/50',
    text: 'text-red-600 dark:text-red-400',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    icon: 'bg-teal-100 dark:bg-teal-900/50',
    text: 'text-teal-600 dark:text-teal-400',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    icon: 'bg-indigo-100 dark:bg-indigo-900/50',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-950/30',
    icon: 'bg-green-100 dark:bg-green-900/50',
    text: 'text-green-600 dark:text-green-400',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    icon: 'bg-cyan-100 dark:bg-cyan-900/50',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
  orange: {
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    icon: 'bg-orange-100 dark:bg-orange-900/50',
    text: 'text-orange-600 dark:text-orange-400',
  },
  pink: {
    bg: 'bg-pink-50 dark:bg-pink-950/30',
    icon: 'bg-pink-100 dark:bg-pink-900/50',
    text: 'text-pink-600 dark:text-pink-400',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-950/30',
    icon: 'bg-yellow-100 dark:bg-yellow-900/50',
    text: 'text-yellow-600 dark:text-yellow-400',
  },
  slate: {
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    icon: 'bg-slate-100 dark:bg-slate-900/50',
    text: 'text-slate-600 dark:text-slate-400',
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KpiCard({ title, value, icon, color, format, loading, dataSource, description, tooltipPosition = 'bottom', onClick }: KpiCardProps) {
  const IconComponent = ICON_MAP[icon] || Baby
  const colorClasses = COLOR_CLASSES[color] || COLOR_CLASSES.blue

  const formattedValue = formatKpiValue(value, format)
  const tooltipText = buildKpiTooltipText(description, dataSource, !!onClick)

  const cardContent = (
    <div
      className={cn(
        'rounded-xl p-4 transition-all duration-200 hover:shadow-md',
        colorClasses.bg,
        onClick && 'cursor-pointer hover:ring-2 hover:ring-slate-300 dark:hover:ring-slate-600 active:scale-[0.98]',
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          ) : (
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formattedValue}
            </p>
          )}
        </div>
        <div className={cn('p-2 rounded-lg', colorClasses.icon)}>
          <IconComponent className={cn('h-5 w-5', colorClasses.text)} />
        </div>
      </div>
    </div>
  )

  if (!tooltipText) {
    return cardContent
  }

  return (
    <Tooltip content={tooltipText} position={tooltipPosition}>
      {cardContent}
    </Tooltip>
  )
}
