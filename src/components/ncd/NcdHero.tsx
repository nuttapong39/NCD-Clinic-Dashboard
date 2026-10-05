import { Stethoscope } from 'lucide-react'
import logoUrl from '@/assets/logo.png'
import { fiscalYearRange } from '@/utils/fiscalYear'
import { formatThaiDate } from '@/utils/formatters'

interface NcdHeroProps {
  fiscalYear: number
  hospitalName: string | null
}

/** Page hero: content title, period, what the page answers, illustration (UI-TEMPLATE §7.3). */
export function NcdHero({ fiscalYear, hospitalName }: NcdHeroProps) {
  const range = fiscalYearRange(fiscalYear)
  return (
    <section className="surface animate-rise-in relative isolate overflow-hidden bg-linear-to-br from-white via-white to-teal-50/60">
      <svg className="absolute inset-0 -z-10 h-full w-full opacity-[0.07]" aria-hidden="true">
        <defs>
          <pattern id="hero-ecg" width="160" height="64" patternUnits="userSpaceOnUse">
            <path d="M0 32h52l8-14 10 30 8-22 6 6h76" fill="none" stroke="hsl(175 84% 32%)" strokeWidth="2" strokeLinejoin="round" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-ecg)" />
      </svg>
      <div className="pointer-events-none absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" aria-hidden="true" />

      <div className="grid items-center gap-6 px-6 py-7 sm:grid-cols-[1fr_auto] sm:px-8 sm:py-8">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-white/80 px-3 py-1 text-xs font-medium text-teal-700">
            <Stethoscope className="h-3.5 w-3.5" aria-hidden="true" />
            คลินิกโรคไม่ติดต่อเรื้อรัง · HOSxP
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">ติดตามนัดคลินิกเบาหวานและความดันโลหิตสูง</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-primary">ปีงบประมาณ {fiscalYear}</span> · {formatThaiDate(range.start)} – {formatThaiDate(range.end)}
            {hospitalName && <> · {hospitalName}</>}
          </p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
            วันนี้มีผู้ป่วยนัดกี่ราย มาแล้วเท่าไร ใครยังไม่มาที่ต้องโทรติดตาม และตลอดปีงบประมาณแต่ละคลินิกมีผู้ป่วยมาตามนัดมากน้อยแค่ไหน
            แยกตามโรค คลินิก และสิทธิการรักษา
          </p>
        </div>
        <img src={logoUrl} alt="" aria-hidden="true" className="hidden h-auto w-[200px] sm:block lg:w-[230px]" />
      </div>
    </section>
  )
}
