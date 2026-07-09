// src/pages/PregnancyLaborDashboard.tsx
import { useCallback, useState } from 'react'
import { useBmsSessionContext } from '@/contexts/BmsSessionContext'
import { pregnancyQueries } from '@/services/pregnancyQueries'
import type {
  PregnancyKpis,
  DeliveryTrendData,
  DeliveryTypeData,
  GaDistributionData,
  BirthWeightData,
  AncComplianceData,
  RecentDelivery,
  HighRiskPregnancy,
  UpcomingEdc,
} from '@/types/pregnancy'
import { KpiCardsRow, ChartsGrid, SummaryTables, KpiDetailModal } from '@/components/pregnancy'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { RefreshCw, Calendar, Stethoscope, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useQuery } from '@/hooks/useQuery'
import { parseArray, parseNumber } from '@/utils/dataParser'
import { processDeliveryTypes } from '@/services/pregnancyDataProcessing'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PregnancyLaborDashboard() {
  const session = useBmsSessionContext()

  const dbType = session.connectionConfig?.databaseType ?? 'mysql'
  const hospitalName = session.session?.userInfo.location ?? 'โรงพยาบาล'
  const isConnected = session.sessionState === 'connected'

  // Fetch KPIs + delivery types (shared between KPI cards and charts)
  const kpisQuery = useQuery<{ kpis: PregnancyKpis; deliveryTypes: DeliveryTypeData[] } | null>({
    queryFn: async () => {
      if (!isConnected) return null

      const [
        activeRes, newAncRes, dueRes, deliveriesRes, cSectionRes, highRiskRes, ttRes, anc5Res,
        earlyAncRes, anc8Res, lowBwRes, pretermRes, lowApgarRes, stillbirthRes,
      ] = await Promise.all([
        session.executeQuery(pregnancyQueries.getActivePregnancies(dbType)),
        session.executeQuery(pregnancyQueries.getNewAncThisMonth(dbType)),
        session.executeQuery(pregnancyQueries.getDueWithin30Days(dbType)),
        session.executeQuery(pregnancyQueries.getDeliveriesThisMonth(dbType)),
        session.executeQuery(pregnancyQueries.getCSectionRate(dbType)),
        session.executeQuery(pregnancyQueries.getHighRiskCount(dbType)),
        session.executeQuery(pregnancyQueries.getTtVaccineCoverage(dbType)),
        session.executeQuery(pregnancyQueries.getAnc5PlusCoverage(dbType)),
        // MOPH 2568 + WHO indicators
        session.executeQuery(pregnancyQueries.getFirstAncBefore12Weeks(dbType)),
        session.executeQuery(pregnancyQueries.getAnc8QualityCompletion(dbType)),
        session.executeQuery(pregnancyQueries.getLowBirthWeightRate(dbType)),
        session.executeQuery(pregnancyQueries.getPretermBirthRate(dbType)),
        session.executeQuery(pregnancyQueries.getLowApgarRate(dbType)),
        session.executeQuery(pregnancyQueries.getStillbirthRate(dbType)),
      ])

      const activePregnancies = parseNumber(activeRes.data?.[0]?.['active_pregnancies']) ?? 0
      const newAncThisMonth = parseNumber(newAncRes.data?.[0]?.['new_anc']) ?? 0
      const dueWithin30Days = parseNumber(dueRes.data?.[0]?.['due_soon']) ?? 0
      const deliveriesThisMonth = parseNumber(deliveriesRes.data?.[0]?.['deliveries']) ?? 0
      const highRiskCount = parseNumber(highRiskRes.data?.[0]?.['high_risk']) ?? 0
      const ttVaccineCoverage = parseNumber(ttRes.data?.[0]?.['tt_coverage_percent']) ?? 0
      const anc5PlusCoverage = parseNumber(anc5Res.data?.[0]?.['anc5_plus_percent']) ?? 0
      const firstAncBefore12Weeks = parseNumber(earlyAncRes.data?.[0]?.['early_anc_percent']) ?? 0
      const anc8QualityCompletion = parseNumber(anc8Res.data?.[0]?.['anc8_quality_percent']) ?? 0
      const lowBirthWeightRate = parseNumber(lowBwRes.data?.[0]?.['low_bw_percent']) ?? 0
      const pretermBirthRate = parseNumber(pretermRes.data?.[0]?.['preterm_percent']) ?? 0
      const lowApgarRate = parseNumber(lowApgarRes.data?.[0]?.['low_apgar_percent']) ?? 0
      const stillbirthRate = parseNumber(stillbirthRes.data?.[0]?.['stillbirth_percent']) ?? 0

      // Calculate C-section rate and delivery type chart data from same response
      const { cSectionRate, deliveryTypes } = processDeliveryTypes(
        parseArray<Record<string, unknown>>(cSectionRes.data)
      )

      return {
        kpis: {
          activePregnancies,
          newAncThisMonth,
          dueWithin30Days,
          deliveriesThisMonth,
          cSectionRate,
          highRiskCount,
          ttVaccineCoverage,
          anc5PlusCoverage,
          firstAncBefore12Weeks,
          anc8QualityCompletion,
          lowBirthWeightRate,
          pretermBirthRate,
          lowApgarRate,
          stillbirthRate,
        },
        deliveryTypes,
      }
    },
    enabled: isConnected,
  })

  // Fetch chart data (excluding delivery types which come from kpisQuery)
  const chartsQuery = useQuery<{
    deliveryTrend: DeliveryTrendData[]
    gaDistribution: GaDistributionData[]
    birthWeight: BirthWeightData[]
    ancCompliance: AncComplianceData[]
  }>({
    queryFn: async () => {
      if (!isConnected) {
        return {
          deliveryTrend: [],
          gaDistribution: [],
          birthWeight: [],
          ancCompliance: [],
        }
      }

      const [trendRes, gaRes, weightRes, ancRes] = await Promise.all([
        session.executeQuery(pregnancyQueries.getDeliveryTrend(dbType)),
        session.executeQuery(pregnancyQueries.getGaDistribution(dbType)),
        session.executeQuery(pregnancyQueries.getBirthWeightDistribution(dbType)),
        session.executeQuery(pregnancyQueries.getAncCompliance(dbType)),
      ])

      return {
        deliveryTrend: parseArray<DeliveryTrendData>(trendRes.data),
        gaDistribution: parseArray<GaDistributionData>(gaRes.data),
        birthWeight: parseArray<BirthWeightData>(weightRes.data),
        ancCompliance: parseArray<AncComplianceData>(ancRes.data),
      }
    },
    enabled: isConnected,
  })

  // Fetch table data
  const tablesQuery = useQuery<{
    recentDeliveries: RecentDelivery[]
    highRiskPregnancies: HighRiskPregnancy[]
    upcomingEdc: UpcomingEdc[]
  }>({
    queryFn: async () => {
      if (!isConnected) {
        return {
          recentDeliveries: [],
          highRiskPregnancies: [],
          upcomingEdc: [],
        }
      }

      const [recentRes, highRiskRes, upcomingRes] = await Promise.all([
        session.executeQuery(pregnancyQueries.getRecentDeliveries(dbType)),
        session.executeQuery(pregnancyQueries.getHighRiskPregnancies(dbType)),
        session.executeQuery(pregnancyQueries.getUpcomingEdc(dbType)),
      ])

      return {
        recentDeliveries: parseArray<RecentDelivery>(recentRes.data),
        highRiskPregnancies: parseArray<HighRiskPregnancy>(highRiskRes.data),
        upcomingEdc: parseArray<UpcomingEdc>(upcomingRes.data),
      }
    },
    enabled: isConnected,
  })

  const isLoading = kpisQuery.isLoading || chartsQuery.isLoading || tablesQuery.isLoading
  const [lastUpdated, setLastUpdated] = useState(() => new Date().toLocaleString('th-TH'))

  // KPI detail modal state
  const [detailKpiKey, setDetailKpiKey] = useState<keyof PregnancyKpis | null>(null)

  const handleKpiClick = useCallback((kpiKey: keyof PregnancyKpis) => {
    setDetailKpiKey(kpiKey)
  }, [])

  // Refresh all data
  const handleRefresh = useCallback(() => {
    kpisQuery.execute()
    chartsQuery.execute()
    tablesQuery.execute()
    setLastUpdated(new Date().toLocaleString('th-TH'))
  }, [kpisQuery.execute, chartsQuery.execute, tablesQuery.execute])

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 dark:text-slate-400">
          กรุณาเชื่อมต่อ Session ก่อนใช้งาน Dashboard
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* ================================================================= */}
      {/* Dashboard Header                                                  */}
      {/* ================================================================= */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 shadow-lg">
        {/* Decorative background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-400 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-emerald-400 to-transparent rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/25">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                ระบบฝากครรภ์และการคลอด
              </h1>
              <p className="text-slate-400 flex items-center gap-2 text-sm mt-0.5">
                <Calendar className="h-3.5 w-3.5" />
                {hospitalName}
                <span className="text-slate-600">|</span>
                อัปเดต: {lastUpdated}
                {kpisQuery.isSuccess && kpisQuery.executionTimeMs !== null && (
                  <>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-500">
                      โหลดข้อมูลใน {(kpisQuery.executionTimeMs / 1000).toFixed(1)} วินาที
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/15 hover:text-white disabled:opacity-40 backdrop-blur-sm border border-white/10 transition-all text-sm font-medium"
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
              รีเฟรช
            </button>
          </div>
        </div>

        {/* Clinical flow indicator */}
        <div className="relative mt-5 flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            ฝากครรภ์
          </div>
          <div className="w-6 h-px bg-slate-600" />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            การคลอด
          </div>
          <div className="w-6 h-px bg-slate-600" />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            ทารกแรกเกิด
          </div>
        </div>
      </div>

      {/* ================================================================= */}
      {/* KPI Cards — grouped by clinical section                           */}
      {/* ================================================================= */}
      <section>
        <KpiCardsRow kpis={kpisQuery.data?.kpis ?? null} loading={kpisQuery.isLoading} onKpiClick={handleKpiClick} />
      </section>

      {/* Error Banner */}
      {(kpisQuery.isError || chartsQuery.isError || tablesQuery.isError) && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <p className="text-sm text-red-700 dark:text-red-300">
              เกิดข้อผิดพลาดในการโหลดข้อมูล กรุณาลองใหม่อีกครั้ง
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 rounded-lg hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {/* ================================================================= */}
      {/* Charts — grouped by clinical section                              */}
      {/* ================================================================= */}
      <section>
        <ChartsGrid
          deliveryTrend={chartsQuery.data?.deliveryTrend ?? []}
          deliveryTypes={kpisQuery.data?.deliveryTypes ?? []}
          gaDistribution={chartsQuery.data?.gaDistribution ?? []}
          birthWeight={chartsQuery.data?.birthWeight ?? []}
          apgarScores={[]}
          ancCompliance={chartsQuery.data?.ancCompliance ?? []}
          loading={chartsQuery.isLoading || kpisQuery.isLoading}
        />
      </section>

      {/* ================================================================= */}
      {/* Summary Tables — Antenatal → Labor order                          */}
      {/* ================================================================= */}
      <section>
        <SectionHeader title="รายละเอียด" subtitle="Detail Tables" accent="from-slate-400 to-slate-600" />
        <SummaryTables
          recentDeliveries={tablesQuery.data?.recentDeliveries ?? []}
          highRiskPregnancies={tablesQuery.data?.highRiskPregnancies ?? []}
          upcomingEdc={tablesQuery.data?.upcomingEdc ?? []}
          loading={tablesQuery.isLoading}
        />
      </section>

      {/* KPI Detail Modal */}
      <KpiDetailModal
        open={detailKpiKey !== null}
        onClose={() => setDetailKpiKey(null)}
        kpiKey={detailKpiKey}
        kpiValue={detailKpiKey && kpisQuery.data?.kpis ? kpisQuery.data.kpis[detailKpiKey] : null}
      />
    </div>
  )
}
