import { cn } from '@/lib/utils'

interface SegmentedToggleProps<T extends string> {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}

export function SegmentedToggle<T extends string>({ label, value, options, onChange }: SegmentedToggleProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-full bg-muted/60 p-1">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
