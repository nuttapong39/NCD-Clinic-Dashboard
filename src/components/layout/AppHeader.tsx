// =============================================================================
// App header — sticky frosted bar (UI-TEMPLATE §7.2); single page, so no tabs
// =============================================================================

import { Link } from 'react-router-dom'
import { Database, LogOut } from 'lucide-react'
import { useBmsSessionContext } from '@/contexts/BmsSessionContext'
import { BrandMark } from '@/components/layout/BrandMark'

const DATABASE_LABELS = { mysql: 'MySQL', postgresql: 'PostgreSQL' } as const

export function AppHeader() {
  const { session, connectionConfig, disconnectSession } = useBmsSessionContext()
  const databaseType = connectionConfig?.databaseType ?? session?.databaseType
  const userName = session?.userInfo.name ?? ''

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link
          to="/"
          aria-label="NCD Clinic Dashboard — หน้าหลัก"
          className="flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandMark />
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold tracking-tight">คลินิกเบาหวาน · ความดัน</span>
            <span className="hidden truncate text-xs text-muted-foreground sm:block">NCD Clinic Dashboard</span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50/80 px-3 py-1 text-xs font-medium text-emerald-700 md:inline-flex">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            เชื่อมต่อแล้ว
          </span>

          {databaseType && (
            <span className="hidden items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground lg:inline-flex">
              <Database className="h-3.5 w-3.5" aria-hidden="true" />
              {DATABASE_LABELS[databaseType]}
            </span>
          )}

          {session && (
            <span className="flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3">
              <span
                className="grid h-7 w-7 place-items-center rounded-full bg-linear-to-br from-teal-500 to-sky-500 text-xs font-semibold text-white"
                aria-hidden="true"
              >
                {userName.charAt(0)}
              </span>
              <span className="hidden min-w-0 leading-tight sm:block">
                <span className="block max-w-40 truncate text-xs font-medium">{userName}</span>
                <span className="block max-w-40 truncate text-[11px] text-muted-foreground">{session.userInfo.department}</span>
              </span>
            </span>
          )}

          <button
            type="button"
            onClick={disconnectSession}
            aria-label="ออกจากระบบ"
            className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span className="hidden md:inline">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </header>
  )
}
