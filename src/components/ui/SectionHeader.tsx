interface SectionHeaderProps {
  title: string
  subtitle: string
  accent: string
}

export function SectionHeader({ title, subtitle, accent }: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-1 h-8 rounded-full bg-gradient-to-b ${accent}`} />
      <div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-wide">{title}</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest">{subtitle}</p>
      </div>
    </div>
  )
}
