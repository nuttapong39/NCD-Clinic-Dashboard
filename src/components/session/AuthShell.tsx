// =============================================================================
// Shared shell for login / session-expired screens (UI-TEMPLATE §7.12)
// =============================================================================

import type { ReactNode } from 'react'
import { CalendarRange, Database, ShieldCheck } from 'lucide-react'
import logoUrl from '@/assets/logo.png'
import { BrandMark } from '@/components/layout/BrandMark'

const FEATURES = [
  { icon: Database, title: 'เชื่อมต่อ HOSxP', description: 'สรุปนัดวันนี้และรายชื่อผู้ป่วยที่ยังไม่มา' },
  { icon: CalendarRange, title: 'แนวโน้มรายปีงบประมาณ', description: 'แยกตามคลินิกและสิทธิการรักษา' },
  { icon: ShieldCheck, title: 'ปลอดภัยด้วย BMS Session', description: 'อ่านข้อมูลอย่างเดียวผ่านระบบยืนยันตัวตน' },
] as const

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-white via-teal-50/40 to-sky-50/60 px-12 py-12 lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" aria-hidden="true" />
        <div className="relative flex items-center gap-3">
          <BrandMark size="md" />
          <div>
            <p className="text-base font-semibold tracking-tight">คลินิกเบาหวาน · ความดัน</p>
            <p className="text-xs text-muted-foreground">แดชบอร์ดติดตามนัด · HOSxP</p>
          </div>
        </div>

        <div className="relative">
          <img src={logoUrl} alt="" aria-hidden="true" className="mx-auto h-auto w-64 xl:w-72" />
          <h2 className="mt-8 text-3xl font-semibold leading-snug tracking-tight">
            ติดตามนัดผู้ป่วย
            <br />
            <span className="bg-linear-to-r from-teal-600 to-sky-500 bg-clip-text text-transparent">
              เบาหวานและความดันโลหิตสูง
            </span>
          </h2>
        </div>

        <ul className="relative grid gap-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <li key={title} className="surface flex items-start gap-3 p-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent text-primary" aria-hidden="true">
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{title}</span>
                <span className="block text-xs text-muted-foreground">{description}</span>
              </span>
            </li>
          ))}
        </ul>
      </aside>

      <main className="flex flex-col items-center justify-center gap-6 px-4 py-10 sm:px-6">
        <div className="flex items-center gap-3 lg:hidden">
          <BrandMark />
          <span className="text-sm font-semibold tracking-tight">NCD Clinic Dashboard</span>
        </div>
        <div className="surface w-full max-w-md p-6 sm:p-8">{children}</div>
      </main>
    </div>
  )
}
