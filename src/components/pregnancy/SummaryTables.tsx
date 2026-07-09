// src/components/pregnancy/SummaryTables.tsx
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type {
  RecentDelivery,
  HighRiskPregnancy,
  UpcomingEdc,
} from '@/types/pregnancy'
import { cn } from '@/lib/utils'
import { Tooltip } from '@/components/ui/Tooltip'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SummaryTablesProps {
  recentDeliveries: RecentDelivery[]
  highRiskPregnancies: HighRiskPregnancy[]
  upcomingEdc: UpcomingEdc[]
  loading?: boolean
}

// ---------------------------------------------------------------------------
// Accordion Item Component
// ---------------------------------------------------------------------------

interface AccordionItemProps {
  title: string
  count: number
  expanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

function AccordionItem({ title, count, expanded, onToggle, children }: AccordionItemProps) {
  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden w-full">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-slate-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-500" />
          )}
          <span className="font-medium text-slate-900 dark:text-slate-100">{title}</span>
        </div>
        <span className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full text-sm">
          {count}
        </span>
      </button>
      {expanded && (
        <div className="p-4 bg-white dark:bg-slate-900">
          {children}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Loading Skeleton
// ---------------------------------------------------------------------------

function TableSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="text-center py-8 text-slate-500 dark:text-slate-400">
      ไม่มีข้อมูลในช่วงเวลานี้ ลองรีเฟรชข้อมูลหรือตรวจสอบการเชื่อมต่อ
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function SummaryTables({
  recentDeliveries,
  highRiskPregnancies,
  upcomingEdc,
  loading,
}: SummaryTablesProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    recentDeliveries: true,
    highRisk: false,
    upcoming: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  return (
    <div className="space-y-4 w-full">
      {/* Recent Deliveries Table */}
      <Tooltip
        content="แสดงรายการคลอดย้อนหลัง 30 วัน โดยดึงข้อมูลจาก person_labour เชื่อมกับ person_anc และ person แสดง HN, ชื่อ, GA, ประเภทการคลอด, น้ำหนัก, Apgar\n\nตาราง: person_labour, person_anc"
        position="top"
      >
        <AccordionItem
          title="การคลอดล่าสุด (30 วันที่ผ่านมา)"
          count={recentDeliveries.length}
          expanded={expandedSections.recentDeliveries}
          onToggle={() => toggleSection('recentDeliveries')}
        >
          {loading ? (
            <TableSkeleton />
          ) : recentDeliveries.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left p-2 font-medium text-slate-600 dark:text-slate-400">วันที่</th>
                    <th className="text-left p-2 font-medium text-slate-600 dark:text-slate-400">HN</th>
                    <th className="text-left p-2 font-medium text-slate-600 dark:text-slate-400">ชื่อ-สกุล</th>
                    <th className="text-center p-2 font-medium text-slate-600 dark:text-slate-400">GA</th>
                    <th className="text-left p-2 font-medium text-slate-600 dark:text-slate-400">ประเภท</th>
                    <th className="text-right p-2 font-medium text-slate-600 dark:text-slate-400">น้ำหนัก</th>
                    <th className="text-center p-2 font-medium text-slate-600 dark:text-slate-400">Apgar</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDeliveries.map((row) => (
                    <tr key={`${row.hn}-${row.laborDate}`} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-2 text-slate-900 dark:text-slate-100">{row.laborDate}</td>
                      <td className="p-2 text-slate-600 dark:text-slate-400">{row.hn}</td>
                      <td className="p-2 text-slate-900 dark:text-slate-100">{row.patientName}</td>
                      <td className="p-2 text-center text-slate-600 dark:text-slate-400">{row.ga ?? '-'}</td>
                      <td className="p-2 text-slate-600 dark:text-slate-400">{row.deliveryType ?? '-'}</td>
                      <td className="p-2 text-right text-slate-600 dark:text-slate-400">{row.birthWeight ?? '-'}</td>
                      <td className="p-2 text-center text-slate-600 dark:text-slate-400">
                        {row.apgar1 ?? '-'}/{row.apgar5 ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AccordionItem>
      </Tooltip>

      {/* High Risk Pregnancies Table */}
      <Tooltip
        content="แสดงรายชื่อหญิงตั้งครรภ์ที่มีความเสี่ยง (has_risk = 'Y') และยังไม่คลอด เรียงตามกำหนดคลอด (edc) แสดง HN, ชื่อ, EDC, และระดับความเสี่ยง\n\nตาราง: person_anc"
        position="top"
      >
        <AccordionItem
          title="หญิงตั้งครรภ์เสี่ยงสูง"
          count={highRiskPregnancies.length}
          expanded={expandedSections.highRisk}
          onToggle={() => toggleSection('highRisk')}
        >
          {loading ? (
            <TableSkeleton />
          ) : highRiskPregnancies.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left p-2 font-medium text-slate-600 dark:text-slate-400">HN</th>
                    <th className="text-left p-2 font-medium text-slate-600 dark:text-slate-400">ชื่อ-สกุล</th>
                    <th className="text-left p-2 font-medium text-slate-600 dark:text-slate-400">EDC</th>
                    <th className="text-center p-2 font-medium text-slate-600 dark:text-slate-400">ระดับเสี่ยง</th>
                  </tr>
                </thead>
                <tbody>
                  {highRiskPregnancies.map((row) => (
                    <tr key={`${row.hn}-${row.edc}`} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-2 text-slate-600 dark:text-slate-400">{row.hn}</td>
                      <td className="p-2 text-slate-900 dark:text-slate-100">{row.patientName}</td>
                      <td className="p-2 text-slate-600 dark:text-slate-400">{row.edc ?? '-'}</td>
                      <td className="p-2 text-center">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          row.riskLevel === 3 ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                          row.riskLevel === 2 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        )}>
                          {row.riskLevel ?? '-'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AccordionItem>
      </Tooltip>

      {/* Upcoming EDC Table */}
      <Tooltip
        content="แสดงรายชื่อหญิงตั้งครรภ์ที่มีกำหนดคลอด (EDC) ภายใน 30 วันจากวันนี้ เรียงตามวันที่ใกล้คลอด แสดงจำนวนวันที่เหลือถึงกำหนดคลอด\n\nตาราง: person_anc"
        position="top"
      >
        <AccordionItem
          title="รอคลอดใกล้เคียง (30 วัน)"
          count={upcomingEdc.length}
          expanded={expandedSections.upcoming}
          onToggle={() => toggleSection('upcoming')}
        >
          {loading ? (
            <TableSkeleton />
          ) : upcomingEdc.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left p-2 font-medium text-slate-600 dark:text-slate-400">HN</th>
                    <th className="text-left p-2 font-medium text-slate-600 dark:text-slate-400">ชื่อ-สกุล</th>
                    <th className="text-left p-2 font-medium text-slate-600 dark:text-slate-400">EDC</th>
                    <th className="text-center p-2 font-medium text-slate-600 dark:text-slate-400">วันที่เหลือ</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingEdc.map((row) => (
                    <tr key={`${row.hn}-${row.edc}`} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-2 text-slate-600 dark:text-slate-400">{row.hn}</td>
                      <td className="p-2 text-slate-900 dark:text-slate-100">{row.patientName}</td>
                      <td className="p-2 text-slate-600 dark:text-slate-400">{row.edc}</td>
                      <td className="p-2 text-center">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-xs font-medium',
                          row.daysRemaining <= 7 ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                          row.daysRemaining <= 14 ? 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        )}>
                          {row.daysRemaining} วัน
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AccordionItem>
      </Tooltip>
    </div>
  )
}
