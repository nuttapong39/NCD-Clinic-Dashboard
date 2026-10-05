import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  title: string
  description?: ReactNode
  icon: ReactNode
  aside?: ReactNode
  className?: string
  children: ReactNode
}

/** Standard section surface with icon, heading, description and an optional aside (UI-TEMPLATE §7.7). */
export function SectionCard({ title, description, icon, aside, className, children }: SectionCardProps) {
  return (
    <section className={cn('surface animate-rise-in p-5 sm:p-6', className)} aria-label={title}>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary" aria-hidden="true">
            {icon}
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            {description && <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{description}</p>}
          </div>
        </div>
        {aside && <div className="shrink-0">{aside}</div>}
      </header>
      {children}
    </section>
  )
}
