import { cn } from '@/lib/utils'

const SIZES = {
  sm: 'h-9 w-9 rounded-xl',
  md: 'h-11 w-11 rounded-2xl',
  lg: 'h-14 w-14 rounded-2xl',
} as const

/** Teal→sky gradient tile with a heart + pulse glyph (UI-TEMPLATE §7.1). */
export function BrandMark({ size = 'sm', className }: { size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center bg-linear-to-br from-teal-500 to-sky-500 text-white',
        'shadow-[0_8px_20px_-8px_rgb(13_148_136/0.65)]',
        SIZES[size],
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[58%] w-[58%]">
        <path
          d="M12 20s-7-4.1-7-9.3A3.8 3.8 0 0 1 12 8.5a3.8 3.8 0 0 1 7 2.2C19 15.9 12 20 12 20z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M5.5 12.5H9l1.4-2.4 2 4.4 1.4-2.8h4.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
