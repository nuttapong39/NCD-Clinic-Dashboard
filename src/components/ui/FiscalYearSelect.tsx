import { CalendarDays } from 'lucide-react'

interface FiscalYearSelectProps {
  value: number
  options: readonly number[]
  onChange: (fiscalYear: number) => void
  disabled?: boolean
}

export function FiscalYearSelect({ value, options, onChange, disabled }: FiscalYearSelectProps) {
  return (
    <label className="relative inline-flex items-center">
      <CalendarDays className="pointer-events-none absolute left-3 h-4 w-4 text-primary" aria-hidden="true" />
      <select
        aria-label="เลือกปีงบประมาณ"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="appearance-none rounded-xl border bg-card py-2 pl-9 pr-9 text-sm font-medium text-foreground transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {options.map((fiscalYear) => (
          <option key={fiscalYear} value={fiscalYear}>
            ปีงบประมาณ {fiscalYear}
          </option>
        ))}
      </select>
      <svg className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  )
}
