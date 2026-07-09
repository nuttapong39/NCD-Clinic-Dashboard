// src/components/pregnancy/KpiDetailModal.tsx
// Modal that shows patient-level detail for a clicked KPI card

import { useState, useEffect, useCallback, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { useBmsSessionContext } from '@/contexts/BmsSessionContext'
import { pregnancyQueries } from '@/services/pregnancyQueries'
import type { PregnancyKpis } from '@/types/pregnancy'
import type { DatabaseType } from '@/types'
import { Search, Users } from 'lucide-react'
import { formatKpiDetailValue } from '@/utils/formatters'
import { cn } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/StatusBadge'

// ---------------------------------------------------------------------------
// KPI Detail Configuration
// ---------------------------------------------------------------------------

interface KpiDetailConfig {
  title: string
  subtitle: string
  getQuery: (dbType: DatabaseType) => string
  columns: { key: string; label: string; align?: 'left' | 'center' | 'right' }[]
}

const KPI_DETAIL_CONFIG: Record<keyof PregnancyKpis, KpiDetailConfig> = {
  activePregnancies: {
    title: 'หญิงตั้งครรภ์ปัจจุบัน',
    subtitle: 'รายชื่อผู้ฝากครรภ์ที่ยังไม่คลอด',
    getQuery: (db) => pregnancyQueries.detailActivePregnancies(db),
    columns: [
      { key: 'hn', label: 'HN' },
      { key: 'patientName', label: 'ชื่อ-สกุล' },
      { key: 'ancDate', label: 'วันฝากครรภ์' },
      { key: 'edc', label: 'กำหนดคลอด' },
      { key: 'gaWeeks', label: 'GA (สัปดาห์)', align: 'center' },
      { key: 'riskStatus', label: 'ความเสี่ยง', align: 'center' },
    ],
  },
  newAncThisMonth: {
    title: 'ฝากครรภ์ใหม่เดือนนี้',
    subtitle: 'รายชื่อผู้ลงทะเบียนฝากครรภ์ใหม่',
    getQuery: (db) => pregnancyQueries.detailNewAncThisMonth(db),
    columns: [
      { key: 'hn', label: 'HN' },
      { key: 'patientName', label: 'ชื่อ-สกุล' },
      { key: 'ancDate', label: 'วันลงทะเบียน' },
      { key: 'lmp', label: 'LMP' },
      { key: 'edc', label: 'กำหนดคลอด' },
      { key: 'gaWeeks', label: 'GA (สัปดาห์)', align: 'center' },
    ],
  },
  firstAncBefore12Weeks: {
    title: 'ฝากครรภ์ก่อน 12 สัปดาห์',
    subtitle: 'รายชื่อตาม GA ที่มาฝากครรภ์ครั้งแรก',
    getQuery: (db) => pregnancyQueries.detailFirstAncBefore12Weeks(db),
    columns: [
      { key: 'hn', label: 'HN' },
      { key: 'patientName', label: 'ชื่อ-สกุล' },
      { key: 'ancDate', label: 'วันฝากครรภ์' },
      { key: 'lmp', label: 'LMP' },
      { key: 'gaAtFirstVisit', label: 'GA ครั้งแรก (สัปดาห์)', align: 'center' },
      { key: 'status', label: 'สถานะ', align: 'center' },
    ],
  },
  highRiskCount: {
    title: 'หญิงตั้งครรภ์เสี่ยงสูง',
    subtitle: 'รายชื่อผู้มีความเสี่ยง',
    getQuery: (db) => pregnancyQueries.detailHighRisk(db),
    columns: [
      { key: 'hn', label: 'HN' },
      { key: 'patientName', label: 'ชื่อ-สกุล' },
      { key: 'edc', label: 'กำหนดคลอด' },
      { key: 'riskLevel', label: 'ระดับเสี่ยง', align: 'center' },
      { key: 'riskDetail', label: 'รายละเอียดความเสี่ยง' },
    ],
  },
  anc5PlusCoverage: {
    title: 'การฝากครรภ์ 5+ ครั้ง',
    subtitle: 'รายชื่อพร้อมจำนวนครั้งที่มาฝากครรภ์',
    getQuery: (db) => pregnancyQueries.detailAnc5Plus(db),
    columns: [
      { key: 'hn', label: 'HN' },
      { key: 'patientName', label: 'ชื่อ-สกุล' },
      { key: 'edc', label: 'กำหนดคลอด' },
      { key: 'visitCount', label: 'จำนวนครั้ง ANC', align: 'center' },
    ],
  },
  anc8QualityCompletion: {
    title: 'ANC ครบ 8 ครั้ง คุณภาพ',
    subtitle: 'รายชื่อพร้อมจำนวน ANC และน้ำหนักทารก',
    getQuery: (db) => pregnancyQueries.detailAnc8Quality(db),
    columns: [
      { key: 'hn', label: 'HN' },
      { key: 'patientName', label: 'ชื่อ-สกุล' },
      { key: 'visitCount', label: 'ครั้ง ANC', align: 'center' },
      { key: 'birthWeight', label: 'น้ำหนักทารก (g)', align: 'right' },
      { key: 'status', label: 'ผลประเมิน', align: 'center' },
    ],
  },
  ttVaccineCoverage: {
    title: 'ครอบคลุมวัคซีน TT',
    subtitle: 'รายชื่อพร้อมสถานะวัคซีน TT',
    getQuery: (db) => pregnancyQueries.detailTtVaccine(db),
    columns: [
      { key: 'hn', label: 'HN' },
      { key: 'patientName', label: 'ชื่อ-สกุล' },
      { key: 'edc', label: 'กำหนดคลอด' },
      { key: 'ttStatus', label: 'สถานะ TT', align: 'center' },
    ],
  },
  dueWithin30Days: {
    title: 'รอคลอดใกล้เคียง (30 วัน)',
    subtitle: 'รายชื่อเรียงตามวันกำหนดคลอด',
    getQuery: (db) => pregnancyQueries.detailDueWithin30Days(db),
    columns: [
      { key: 'hn', label: 'HN' },
      { key: 'patientName', label: 'ชื่อ-สกุล' },
      { key: 'edc', label: 'กำหนดคลอด' },
      { key: 'daysRemaining', label: 'เหลือ (วัน)', align: 'center' },
      { key: 'gaWeeks', label: 'GA (สัปดาห์)', align: 'center' },
      { key: 'riskStatus', label: 'ความเสี่ยง', align: 'center' },
    ],
  },
  deliveriesThisMonth: {
    title: 'การคลอดเดือนนี้',
    subtitle: 'รายชื่อผู้คลอดในเดือนปัจจุบัน',
    getQuery: (db) => pregnancyQueries.detailDeliveriesThisMonth(db),
    columns: [
      { key: 'hn', label: 'HN' },
      { key: 'patientName', label: 'ชื่อ-สกุล' },
      { key: 'laborDate', label: 'วันคลอด' },
      { key: 'deliveryType', label: 'ประเภท' },
      { key: 'ga', label: 'GA', align: 'center' },
      { key: 'birthWeight', label: 'น้ำหนัก (g)', align: 'right' },
    ],
  },
  cSectionRate: {
    title: 'รายละเอียดประเภทการคลอด',
    subtitle: 'รายชื่อจำแนกตามประเภทการคลอด (3 เดือน)',
    getQuery: (db) => pregnancyQueries.detailCSectionRate(db),
    columns: [
      { key: 'hn', label: 'HN' },
      { key: 'patientName', label: 'ชื่อ-สกุล' },
      { key: 'laborDate', label: 'วันคลอด' },
      { key: 'deliveryType', label: 'ประเภท' },
      { key: 'ga', label: 'GA', align: 'center' },
      { key: 'birthWeight', label: 'น้ำหนัก (g)', align: 'right' },
    ],
  },
  pretermBirthRate: {
    title: 'คลอดก่อนกำหนด (GA <37 สัปดาห์)',
    subtitle: 'รายชื่อทารกที่คลอดก่อนกำหนด',
    getQuery: (db) => pregnancyQueries.detailPretermBirth(db),
    columns: [
      { key: 'hn', label: 'HN' },
      { key: 'patientName', label: 'ชื่อ-สกุล' },
      { key: 'laborDate', label: 'วันคลอด' },
      { key: 'ga', label: 'GA (สัปดาห์)', align: 'center' },
      { key: 'deliveryType', label: 'ประเภท' },
      { key: 'birthWeight', label: 'น้ำหนัก (g)', align: 'right' },
    ],
  },
  lowBirthWeightRate: {
    title: 'น้ำหนักแรกคลอดต่ำ (<2500g)',
    subtitle: 'รายชื่อทารกน้ำหนักน้อย',
    getQuery: (db) => pregnancyQueries.detailLowBirthWeight(db),
    columns: [
      { key: 'hn', label: 'HN' },
      { key: 'patientName', label: 'ชื่อ-สกุล' },
      { key: 'laborDate', label: 'วันคลอด' },
      { key: 'birthWeight', label: 'น้ำหนัก (g)', align: 'right' },
      { key: 'ga', label: 'GA', align: 'center' },
      { key: 'deliveryType', label: 'ประเภท' },
    ],
  },
  lowApgarRate: {
    title: 'Apgar Score <7 ที่ 5 นาที',
    subtitle: 'รายชื่อทารกที่มี Apgar ต่ำ',
    getQuery: (db) => pregnancyQueries.detailLowApgar(db),
    columns: [
      { key: 'hn', label: 'HN' },
      { key: 'patientName', label: 'ชื่อ-สกุล' },
      { key: 'laborDate', label: 'วันคลอด' },
      { key: 'apgar1', label: 'Apgar 1 นาที', align: 'center' },
      { key: 'apgar5', label: 'Apgar 5 นาที', align: 'center' },
      { key: 'birthWeight', label: 'น้ำหนัก (g)', align: 'right' },
      { key: 'ga', label: 'GA', align: 'center' },
    ],
  },
  stillbirthRate: {
    title: 'ทารกตายคลอด',
    subtitle: 'รายชื่อกรณีทารกตายคลอด (6 เดือน)',
    getQuery: (db) => pregnancyQueries.detailStillbirth(db),
    columns: [
      { key: 'hn', label: 'HN' },
      { key: 'patientName', label: 'ชื่อ-สกุล' },
      { key: 'laborDate', label: 'วันคลอด' },
      { key: 'ga', label: 'GA', align: 'center' },
      { key: 'birthWeight', label: 'น้ำหนัก (g)', align: 'right' },
      { key: 'deliveryType', label: 'ประเภท' },
    ],
  },
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface KpiDetailModalProps {
  open: boolean
  onClose: () => void
  kpiKey: keyof PregnancyKpis | null
  kpiValue: number | null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KpiDetailModal({ open, onClose, kpiKey, kpiValue }: KpiDetailModalProps) {
  const { connectionConfig, executeQuery } = useBmsSessionContext()
  const dbType = connectionConfig?.databaseType ?? 'mysql'

  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const config = kpiKey ? KPI_DETAIL_CONFIG[kpiKey] : null

  // Use a ref for executeQuery to avoid recreating fetchData on every render
  const executeQueryRef = useRef(executeQuery)
  executeQueryRef.current = executeQuery

  const fetchData = useCallback(async () => {
    if (!config || !kpiKey) return
    setLoading(true)
    setError(null)
    try {
      const sql = config.getQuery(dbType)
      const result = await executeQueryRef.current(sql)
      if (result.data && Array.isArray(result.data)) {
        setData(result.data as Record<string, unknown>[])
      } else {
        setData([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการดึงข้อมูล')
    } finally {
      setLoading(false)
    }
  }, [config, kpiKey, dbType])

  useEffect(() => {
    if (open && kpiKey) {
      setSearchTerm('')
      fetchData()
    }
    if (!open) {
      setData([])
      setError(null)
    }
  }, [open, kpiKey, fetchData])

  if (!config) return null

  const statusColumns = ['status', 'riskStatus', 'ttStatus']

  const filteredData = searchTerm
    ? data.filter(row =>
        Object.values(row).some(val =>
          String(val ?? '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data

  const formatValue = formatKpiDetailValue(kpiKey ?? null, kpiValue ?? null)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={config.title}
      subtitle={`${config.subtitle} — KPI: ${formatValue}`}
      size="xl"
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="ค้นหา HN, ชื่อ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <Users className="h-4 w-4" />
          <span>{filteredData.length} รายการ</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 dark:text-red-400 mb-2">{error}</p>
          <button
            onClick={fetchData}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          {searchTerm ? 'ไม่พบข้อมูลตามคำค้น' : 'ไม่พบข้อมูลรายบุคคลสำหรับตัวชี้วัดนี้'}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="text-center p-3 font-medium text-slate-500 dark:text-slate-400 w-10">#</th>
                {config.columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'p-3 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap',
                      col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredData.map((row, idx) => (
                <tr
                  key={`${String(row['hn'] ?? '')}-${idx}`}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="p-3 text-center text-slate-400 text-xs">{idx + 1}</td>
                  {config.columns.map((col) => {
                    const cellValue = row[col.key]
                    const displayValue = cellValue === null || cellValue === undefined ? '-' : String(cellValue)
                    const isStatus = statusColumns.includes(col.key)

                    return (
                      <td
                        key={col.key}
                        className={cn(
                          'p-3 text-slate-900 dark:text-slate-100',
                          col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left',
                          col.key === 'hn' && 'font-mono text-xs text-slate-500 dark:text-slate-400',
                        )}
                      >
                        {isStatus ? <StatusBadge value={displayValue} /> : displayValue}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
