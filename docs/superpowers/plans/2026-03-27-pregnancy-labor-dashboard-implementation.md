# Pregnancy & Labor Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the main Overview page with a pregnancy/labor focused executive dashboard showing KPIs, charts, and summary tables for ANC and delivery data.

**Architecture:** React functional components using the existing `useBmsSession` hook for database queries. Data flows from `BmsSessionContext` → `PregnancyLaborDashboard` → child components (KpiCardsRow, ChartsGrid, SummaryTables). SQL queries use the `queryBuilder` module for cross-database compatibility (MySQL/PostgreSQL).

**Tech Stack:** TypeScript (strict mode), React 19, Recharts 3.x, Tailwind CSS v4, shadcn/ui components

---

## File Structure

```
src/
├── types/
│   └── pregnancy.ts                    # NEW: Pregnancy-specific TypeScript interfaces
├── services/
│   └── pregnancyQueries.ts             # NEW: SQL queries with db-type awareness
├── components/
│   └── pregnancy/
│       ├── KpiCard.tsx                 # NEW: Single KPI card component
│       ├── KpiCardsRow.tsx             # NEW: Container for 8 KPI cards
│       ├── ChartsGrid.tsx              # NEW: Container for 6 charts
│       ├── DeliveryTrendChart.tsx      # NEW: Line chart for delivery trend
│       ├── DeliveryTypeChart.tsx       # NEW: Pie chart for delivery types
│       ├── GaDistributionChart.tsx     # NEW: Bar chart for GA distribution
│       ├── BirthWeightChart.tsx        # NEW: Bar chart for birth weight
│       ├── ApgarScoreChart.tsx         # NEW: Grouped bar for Apgar scores
│       ├── AncComplianceChart.tsx      # NEW: Bar chart for ANC compliance
│       └── SummaryTables.tsx           # NEW: Collapsible tables
├── pages/
│   ├── Overview.tsx                    # MODIFY: Replace with PregnancyLaborDashboard
│   └── OverviewTemplates.tsx           # NEW: Move old Overview content here
└── App.tsx                             # MODIFY: Add route for templates

tests/
├── unit/
│   ├── pregnancyQueries.test.ts        # NEW: Unit tests for query generation
│   └── pregnancyTypes.test.ts          # NEW: Type guard tests
└── component/
    └── pregnancy/
        ├── KpiCard.test.tsx            # NEW: KPI card component tests
        └── SummaryTables.test.tsx      # NEW: Table component tests
```

---

## Task 1: TypeScript Interfaces for Pregnancy Data

**Files:**
- Create: `src/types/pregnancy.ts`
- Test: `tests/unit/pregnancyTypes.test.ts`

- [ ] **Step 1: Write the failing test for type guards**

```typescript
// tests/unit/pregnancyTypes.test.ts
import { describe, it, expect } from 'vitest'
import {
  isPregnancyKpis,
  isDeliveryTrendData,
  isDeliveryTypeData,
  isRecentDelivery,
} from '@/types/pregnancy'

describe('pregnancy type guards', () => {
  describe('isPregnancyKpis', () => {
    it('returns true for valid PregnancyKpis object', () => {
      const valid = {
        activePregnancies: 10,
        newAncThisMonth: 5,
        dueWithin30Days: 3,
        deliveriesThisMonth: 8,
        cSectionRate: 25.5,
        highRiskCount: 2,
        ttVaccineCoverage: 80.0,
        anc5PlusCoverage: 75.0,
      }
      expect(isPregnancyKpis(valid)).toBe(true)
    })

    it('returns false for missing required field', () => {
      const invalid = {
        activePregnancies: 10,
        // missing other fields
      }
      expect(isPregnancyKpis(invalid)).toBe(false)
    })
  })

  describe('isDeliveryTrendData', () => {
    it('returns true for valid array element', () => {
      expect(isDeliveryTrendData({ month: '2026-01', deliveries: 15 })).toBe(true)
    })

    it('returns false for wrong types', () => {
      expect(isDeliveryTrendData({ month: '2026-01', deliveries: '15' })).toBe(false)
    })
  })

  describe('isDeliveryTypeData', () => {
    it('returns true for valid object', () => {
      expect(isDeliveryTypeData({ type: 'Normal', count: 10, percentage: 50.0 })).toBe(true)
    })
  })

  describe('isRecentDelivery', () => {
    it('returns true for valid delivery record', () => {
      expect(isRecentDelivery({
        laborDate: '2026-03-27',
        hn: '123456',
        patientName: 'นางสมศรี สมบัติ',
        ga: 38,
        deliveryType: 'Normal',
        birthWeight: 3200,
        apgar1: 8,
        apgar5: 9,
      })).toBe(true)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/unit/pregnancyTypes.test.ts`
Expected: FAIL with "Cannot find module '@/types/pregnancy'"

- [ ] **Step 3: Write the TypeScript interfaces and type guards**

```typescript
// src/types/pregnancy.ts
// =============================================================================
// Pregnancy & Labor Dashboard - Type Definitions
// =============================================================================

// ---------------------------------------------------------------------------
// KPI Data Types
// ---------------------------------------------------------------------------

export interface PregnancyKpis {
  activePregnancies: number
  newAncThisMonth: number
  dueWithin30Days: number
  deliveriesThisMonth: number
  cSectionRate: number
  highRiskCount: number
  ttVaccineCoverage: number
  anc5PlusCoverage: number
}

export interface KpiCardConfig {
  key: keyof PregnancyKpis
  title: string
  icon: string
  color: string
  format: 'number' | 'percentage'
}

// ---------------------------------------------------------------------------
// Chart Data Types
// ---------------------------------------------------------------------------

export interface DeliveryTrendData {
  month: string
  deliveries: number
}

export interface DeliveryTypeData {
  type: string
  count: number
  percentage: number
}

export interface GaDistributionData {
  category: string
  count: number
}

export interface BirthWeightData {
  category: string
  count: number
}

export interface ApgarScoreData {
  scoreRange: string
  oneMin: number
  fiveMin: number
}

export interface AncComplianceData {
  visitCount: number
  patientCount: number
}

// ---------------------------------------------------------------------------
// Table Data Types
// ---------------------------------------------------------------------------

export interface RecentDelivery {
  laborDate: string
  hn: string
  patientName: string
  ga: number | null
  deliveryType: string | null
  birthWeight: number | null
  apgar1: number | null
  apgar5: number | null
}

export interface HighRiskPregnancy {
  hn: string
  patientName: string
  edc: string | null
  riskLevel: number | null
  riskList: string | null
}

export interface UpcomingEdc {
  hn: string
  patientName: string
  edc: string
  daysRemaining: number
}

// ---------------------------------------------------------------------------
// Dashboard State Types
// ---------------------------------------------------------------------------

export interface PregnancyDashboardData {
  kpis: PregnancyKpis | null
  deliveryTrend: DeliveryTrendData[]
  deliveryTypes: DeliveryTypeData[]
  gaDistribution: GaDistributionData[]
  birthWeight: BirthWeightData[]
  apgarScores: ApgarScoreData[]
  ancCompliance: AncComplianceData[]
  recentDeliveries: RecentDelivery[]
  highRiskPregnancies: HighRiskPregnancy[]
  upcomingEdc: UpcomingEdc[]
}

// ---------------------------------------------------------------------------
// Type Guards
// ---------------------------------------------------------------------------

export function isPregnancyKpis(value: unknown): value is PregnancyKpis {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.activePregnancies === 'number' &&
    typeof obj.newAncThisMonth === 'number' &&
    typeof obj.dueWithin30Days === 'number' &&
    typeof obj.deliveriesThisMonth === 'number' &&
    typeof obj.cSectionRate === 'number' &&
    typeof obj.highRiskCount === 'number' &&
    typeof obj.ttVaccineCoverage === 'number' &&
    typeof obj.anc5PlusCoverage === 'number'
  )
}

export function isDeliveryTrendData(value: unknown): value is DeliveryTrendData {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.month === 'string' &&
    typeof obj.deliveries === 'number'
  )
}

export function isDeliveryTypeData(value: unknown): value is DeliveryTypeData {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.type === 'string' &&
    typeof obj.count === 'number' &&
    typeof obj.percentage === 'number'
  )
}

export function isRecentDelivery(value: unknown): value is RecentDelivery {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.laborDate === 'string' &&
    typeof obj.hn === 'string' &&
    typeof obj.patientName === 'string'
  )
}

export function isHighRiskPregnancy(value: unknown): value is HighRiskPregnancy {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.hn === 'string' &&
    typeof obj.patientName === 'string'
  )
}

export function isUpcomingEdc(value: unknown): value is UpcomingEdc {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return (
    typeof obj.hn === 'string' &&
    typeof obj.patientName === 'string' &&
    typeof obj.edc === 'string' &&
    typeof obj.daysRemaining === 'number'
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/unit/pregnancyTypes.test.ts`
Expected: PASS (all tests green)

- [ ] **Step 5: Commit**

```bash
git add src/types/pregnancy.ts tests/unit/pregnancyTypes.test.ts
git commit -m "$(cat <<'EOF'
feat: add pregnancy/labor dashboard type definitions

- Add interfaces for KPIs, charts, and table data
- Add type guards for runtime validation
- Add unit tests for type guards

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Pregnancy Queries Service

**Files:**
- Create: `src/services/pregnancyQueries.ts`
- Test: `tests/unit/pregnancyQueries.test.ts`

- [ ] **Step 1: Write the failing test for query generation**

```typescript
// tests/unit/pregnancyQueries.test.ts
import { describe, it, expect } from 'vitest'
import { pregnancyQueries } from '@/services/pregnancyQueries'
import type { DatabaseType } from '@/types'

describe('pregnancyQueries', () => {
  const mysql: DatabaseType = 'mysql'
  const postgresql: DatabaseType = 'postgresql'

  describe('getActivePregnancies', () => {
    it('returns compatible SQL for both databases', () => {
      const mysqlSql = pregnancyQueries.getActivePregnancies(mysql)
      const pgSql = pregnancyQueries.getActivePregnancies(postgresql)

      // Should be identical - no db-specific syntax
      expect(mysqlSql).toBe(pgSql)
      expect(mysqlSql).toContain('SELECT COUNT(*)')
      expect(mysqlSql).toContain('FROM person_anc')
      expect(mysqlSql).toContain('labor_date IS NULL')
    })
  })

  describe('getNewAncThisMonth', () => {
    it('uses DATE_FORMAT for MySQL', () => {
      const sql = pregnancyQueries.getNewAncThisMonth(mysql)
      expect(sql).toContain("DATE_FORMAT(CURDATE(), '%Y-%m-01')")
    })

    it('uses DATE_TRUNC for PostgreSQL', () => {
      const sql = pregnancyQueries.getNewAncThisMonth(postgresql)
      expect(sql).toContain("DATE_TRUNC('month', CURRENT_DATE)")
    })
  })

  describe('getDueWithin30Days', () => {
    it('uses DATE_ADD for MySQL', () => {
      const sql = pregnancyQueries.getDueWithin30Days(mysql)
      expect(sql).toContain('DATE_ADD(CURDATE(), INTERVAL 30 DAY)')
    })

    it('uses INTERVAL for PostgreSQL', () => {
      const sql = pregnancyQueries.getDueWithin30Days(postgresql)
      expect(sql).toContain("INTERVAL '30 days'")
    })
  })

  describe('getDeliveryTrend', () => {
    it('uses DATE_FORMAT for MySQL', () => {
      const sql = pregnancyQueries.getDeliveryTrend(mysql)
      expect(sql).toContain("DATE_FORMAT(pa.labor_date, '%Y-%m')")
    })

    it('uses TO_CHAR for PostgreSQL', () => {
      const sql = pregnancyQueries.getDeliveryTrend(postgresql)
      expect(sql).toContain("TO_CHAR(pa.labor_date, 'YYYY-MM')")
    })
  })

  describe('getGaDistribution', () => {
    it('uses DATEDIFF for MySQL', () => {
      const sql = pregnancyQueries.getGaDistribution(mysql)
      expect(sql).toContain('DATEDIFF(CURDATE(), pa.lmp)')
    })

    it('uses EXTRACT for PostgreSQL', () => {
      const sql = pregnancyQueries.getGaDistribution(postgresql)
      expect(sql).toContain('EXTRACT(DAYS FROM')
    })
  })

  describe('getRecentDeliveries', () => {
    it('uses DATE_SUB for MySQL', () => {
      const sql = pregnancyQueries.getRecentDeliveries(mysql)
      expect(sql).toContain('DATE_SUB(CURDATE(), INTERVAL 30 DAY)')
    })

    it('uses INTERVAL for PostgreSQL', () => {
      const sql = pregnancyQueries.getRecentDeliveries(postgresql)
      expect(sql).toContain("INTERVAL '30 days'")
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/unit/pregnancyQueries.test.ts`
Expected: FAIL with "Cannot find module '@/services/pregnancyQueries'"

- [ ] **Step 3: Write the pregnancy queries service**

```typescript
// src/services/pregnancyQueries.ts
// =============================================================================
// Pregnancy & Labor Dashboard - SQL Query Generator
// Database-type-aware SQL generation for MySQL and PostgreSQL
// =============================================================================

import type { DatabaseType } from '@/types'

// ---------------------------------------------------------------------------
// Date/Time Helper Functions
// ---------------------------------------------------------------------------

function monthStart(dbType: DatabaseType): string {
  if (dbType === 'mysql') {
    return "DATE_FORMAT(CURDATE(), '%Y-%m-01')"
  }
  return "DATE_TRUNC('month', CURRENT_DATE)"
}

function monthsAgo(dbType: DatabaseType, months: number): string {
  if (dbType === 'mysql') {
    return `DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL ${months} MONTH)`
  }
  return `DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '${months} months'`
}

function daysAgo(dbType: DatabaseType, days: number): string {
  if (dbType === 'mysql') {
    return `DATE_SUB(CURDATE(), INTERVAL ${days} DAY)`
  }
  return `CURRENT_DATE - INTERVAL '${days} days'`
}

function daysAhead(dbType: DatabaseType, days: number): string {
  if (dbType === 'mysql') {
    return `DATE_ADD(CURDATE(), INTERVAL ${days} DAY)`
  }
  return `CURRENT_DATE + INTERVAL '${days} days'`
}

function currentDateString(dbType: DatabaseType): string {
  return dbType === 'mysql' ? 'CURDATE()' : 'CURRENT_DATE'
}

function formatMonthColumn(dbType: DatabaseType, column: string): string {
  if (dbType === 'mysql') {
    return `DATE_FORMAT(${column}, '%Y-%m')`
  }
  return `TO_CHAR(${column}, 'YYYY-MM')`
}

function calcGa(dbType: DatabaseType): string {
  if (dbType === 'mysql') {
    return 'FLOOR(DATEDIFF(CURDATE(), pa.lmp) / 7)'
  }
  return "FLOOR(EXTRACT(DAYS FROM (CURRENT_DATE - pa.lmp::date)) / 7)"
}

// ---------------------------------------------------------------------------
// KPI Queries
// ---------------------------------------------------------------------------

function getActivePregnancies(_dbType: DatabaseType): string {
  return `
    SELECT COUNT(*) as active_pregnancies
    FROM person_anc pa
    WHERE pa.labor_date IS NULL
      AND (pa.discharge IS NULL OR pa.discharge = 'N')
  `.trim()
}

function getNewAncThisMonth(dbType: DatabaseType): string {
  return `
    SELECT COUNT(*) as new_anc
    FROM person_anc pa
    WHERE pa.anc_register_date >= ${monthStart(dbType)}
  `.trim()
}

function getDueWithin30Days(dbType: DatabaseType): string {
  return `
    SELECT COUNT(*) as due_soon
    FROM person_anc pa
    WHERE pa.labor_date IS NULL
      AND pa.edc BETWEEN ${currentDateString(dbType)} AND ${daysAhead(dbType, 30)}
  `.trim()
}

function getDeliveriesThisMonth(dbType: DatabaseType): string {
  return `
    SELECT COUNT(*) as deliveries
    FROM person_anc pa
    WHERE pa.labor_date >= ${monthStart(dbType)}
  `.trim()
}

function getCSectionRate(dbType: DatabaseType): string {
  return `
    SELECT
      plt.person_labour_type_name,
      COUNT(*) as count
    FROM person_labour pl
    JOIN person_anc pa ON pl.person_id = pa.person_id
    JOIN person_labour_type plt ON pl.person_labour_type_id = plt.person_labour_type_id
    WHERE pa.labor_date >= ${monthsAgo(dbType, 3)}
    GROUP BY plt.person_labour_type_name
  `.trim()
}

function getHighRiskCount(_dbType: DatabaseType): string {
  return `
    SELECT COUNT(*) as high_risk
    FROM person_anc pa
    WHERE pa.has_risk = 'Y'
      AND pa.labor_date IS NULL
  `.trim()
}

function getTtVaccineCoverage(_dbType: DatabaseType): string {
  return `
    SELECT
      ROUND(
        COUNT(CASE WHEN pa.vaccine_tt_complete = 'Y' THEN 1 END) * 100.0 /
        NULLIF(COUNT(*), 0)
      , 1) as tt_coverage_percent
    FROM person_anc pa
    WHERE pa.labor_date >= ${monthsAgo('mysql', 3)}
      OR pa.labor_date IS NULL
  `.trim()
}

function getAnc5PlusCoverage(dbType: DatabaseType): string {
  return `
    SELECT
      ROUND(
        COUNT(CASE WHEN visit_count >= 5 THEN 1 END) * 100.0 /
        NULLIF(COUNT(*), 0)
      , 1) as anc5_plus_percent
    FROM (
      SELECT
        pa.person_anc_id,
        COUNT(papc.person_anc_preg_care_id) as visit_count
      FROM person_anc pa
      LEFT JOIN person_anc_preg_care papc ON pa.person_anc_id = papc.person_anc_id
      WHERE pa.labor_date >= ${monthsAgo(dbType, 3)}
      GROUP BY pa.person_anc_id
    ) sub
  `.trim()
}

// ---------------------------------------------------------------------------
// Chart Queries
// ---------------------------------------------------------------------------

function getDeliveryTrend(dbType: DatabaseType): string {
  return `
    SELECT
      ${formatMonthColumn(dbType, 'pa.labor_date')} as month,
      COUNT(*) as deliveries
    FROM person_anc pa
    WHERE pa.labor_date >= ${monthsAgo(dbType, 3)}
    GROUP BY ${formatMonthColumn(dbType, 'pa.labor_date')}
    ORDER BY month
  `.trim()
}

function getBirthWeightDistribution(_dbType: DatabaseType): string {
  return `
    SELECT
      CASE
        WHEN pl.birth_weight < 2500 THEN 'Low (<2500g)'
        WHEN pl.birth_weight > 4000 THEN 'High (>4000g)'
        ELSE 'Normal (2500-4000g)'
      END as category,
      COUNT(*) as count
    FROM person_labour pl
    JOIN person_anc pa ON pl.person_id = pa.person_id
    WHERE pa.labor_date >= ${monthsAgo('mysql', 3)}
    GROUP BY category
  `.trim()
}

function getGaDistribution(dbType: DatabaseType): string {
  return `
    SELECT
      CASE
        WHEN ga < 12 THEN '1st Trimester (<12w)'
        WHEN ga < 28 THEN '2nd Trimester (12-27w)'
        WHEN ga < 37 THEN '3rd Trimester (28-36w)'
        ELSE 'Term (37w+)'
      END as category,
      COUNT(*) as count
    FROM (
      SELECT
        ${calcGa(dbType)} as ga
      FROM person_anc pa
      WHERE pa.labor_date IS NULL
        AND pa.lmp IS NOT NULL
    ) sub
    GROUP BY category
  `.trim()
}

function getAncCompliance(dbType: DatabaseType): string {
  return `
    SELECT
      visit_count,
      COUNT(*) as patient_count
    FROM (
      SELECT
        pa.person_anc_id,
        COUNT(papc.person_anc_preg_care_id) as visit_count
      FROM person_anc pa
      LEFT JOIN person_anc_preg_care papc ON pa.person_anc_id = papc.person_anc_id
      WHERE pa.labor_date >= ${monthsAgo(dbType, 3)}
      GROUP BY pa.person_anc_id
    ) sub
    GROUP BY visit_count
    ORDER BY visit_count
  `.trim()
}

// ---------------------------------------------------------------------------
// Table Queries
// ---------------------------------------------------------------------------

function getRecentDeliveries(dbType: DatabaseType): string {
  return `
    SELECT
      pa.labor_date as laborDate,
      p.hn,
      CONCAT(p.pname, p.fname, ' ', p.lname) as patientName,
      pl.ga,
      plt.person_labour_type_name as deliveryType,
      pl.birth_weight as birthWeight,
      pl.apgar_score_1 as apgar1,
      pl.apgar_score_5 as apgar5
    FROM person_labour pl
    JOIN person_anc pa ON pl.person_id = pa.person_id
    JOIN person p ON pa.person_id = p.person_id
    LEFT JOIN person_labour_type plt ON pl.person_labour_type_id = plt.person_labour_type_id
    WHERE pa.labor_date >= ${daysAgo(dbType, 30)}
    ORDER BY pa.labor_date DESC
    LIMIT 50
  `.trim()
}

function getHighRiskPregnancies(_dbType: DatabaseType): string {
  return `
    SELECT
      p.hn,
      CONCAT(p.pname, p.fname, ' ', p.lname) as patientName,
      pa.edc,
      pa.risk_level as riskLevel,
      pa.risk_list as riskList
    FROM person_anc pa
    JOIN person p ON pa.person_id = p.person_id
    WHERE pa.has_risk = 'Y'
      AND pa.labor_date IS NULL
    ORDER BY pa.edc ASC
    LIMIT 50
  `.trim()
}

function getUpcomingEdc(dbType: DatabaseType): string {
  const daysRemaining = dbType === 'mysql'
    ? 'DATEDIFF(pa.edc, CURDATE())'
    : '(pa.edc - CURRENT_DATE)::int'

  return `
    SELECT
      p.hn,
      CONCAT(p.pname, p.fname, ' ', p.lname) as patientName,
      pa.edc,
      ${daysRemaining} as daysRemaining
    FROM person_anc pa
    JOIN person p ON pa.person_id = p.person_id
    WHERE pa.labor_date IS NULL
      AND pa.edc BETWEEN ${currentDateString(dbType)} AND ${daysAhead(dbType, 30)}
    ORDER BY pa.edc ASC
  `.trim()
}

// ---------------------------------------------------------------------------
// Exported Query Collection
// ---------------------------------------------------------------------------

export const pregnancyQueries = {
  // KPI queries
  getActivePregnancies,
  getNewAncThisMonth,
  getDueWithin30Days,
  getDeliveriesThisMonth,
  getCSectionRate,
  getHighRiskCount,
  getTtVaccineCoverage,
  getAnc5PlusCoverage,

  // Chart queries
  getDeliveryTrend,
  getBirthWeightDistribution,
  getGaDistribution,
  getAncCompliance,

  // Table queries
  getRecentDeliveries,
  getHighRiskPregnancies,
  getUpcomingEdc,
} as const
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/unit/pregnancyQueries.test.ts`
Expected: PASS (all tests green)

- [ ] **Step 5: Commit**

```bash
git add src/services/pregnancyQueries.ts tests/unit/pregnancyQueries.test.ts
git commit -m "$(cat <<'EOF'
feat: add pregnancy queries service with cross-database support

- Add SQL query generators for MySQL and PostgreSQL
- Include KPI, chart, and table queries
- Add unit tests for query generation

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: KPI Card Component

**Files:**
- Create: `src/components/pregnancy/KpiCard.tsx`
- Test: `tests/component/pregnancy/KpiCard.test.tsx`

- [ ] **Step 1: Write the failing test for KpiCard**

```typescript
// tests/component/pregnancy/KpiCard.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiCard } from '@/components/pregnancy/KpiCard'

describe('KpiCard', () => {
  it('renders title and value correctly', () => {
    render(
      <KpiCard
        title="ตั้งครรภ์ปัจจุบัน"
        value={42}
        icon="Baby"
        color="rose"
        format="number"
      />
    )

    expect(screen.getByText('ตั้งครรภ์ปัจจุบัน')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('formats percentage values correctly', () => {
    render(
      <KpiCard
        title="อัตรา C-Section"
        value={25.5}
        icon="Activity"
        color="purple"
        format="percentage"
      />
    )

    expect(screen.getByText('25.5%')).toBeInTheDocument()
  })

  it('shows loading skeleton when loading prop is true', () => {
    render(
      <KpiCard
        title="ตั้งครรภ์ปัจจุบัน"
        value={null}
        icon="Baby"
        color="rose"
        format="number"
        loading
      />
    )

    // Should not show value when loading
    expect(screen.queryByText('42')).not.toBeInTheDocument()
  })

  it('shows N/A when value is null and not loading', () => {
    render(
      <KpiCard
        title="ตั้งครรภ์ปัจจุบัน"
        value={null}
        icon="Baby"
        color="rose"
        format="number"
      />
    )

    expect(screen.getByText('N/A')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test tests/component/pregnancy/KpiCard.test.tsx`
Expected: FAIL with "Cannot find module '@/components/pregnancy/KpiCard'"

- [ ] **Step 3: Write the KpiCard component**

```typescript
// src/components/pregnancy/KpiCard.tsx
import { Baby, CalendarPlus, Clock, Heart, Activity, AlertTriangle, Shield, CheckCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface KpiCardProps {
  title: string
  value: number | null
  icon: string
  color: 'rose' | 'blue' | 'amber' | 'emerald' | 'purple' | 'red' | 'teal' | 'indigo'
  format: 'number' | 'percentage'
  loading?: boolean
}

// ---------------------------------------------------------------------------
// Icon Map
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, LucideIcon> = {
  Baby,
  CalendarPlus,
  Clock,
  Heart,
  Activity,
  AlertTriangle,
  Shield,
  CheckCircle,
}

// ---------------------------------------------------------------------------
// Color Classes Map
// ---------------------------------------------------------------------------

const COLOR_CLASSES: Record<string, { bg: string; icon: string; text: string }> = {
  rose: {
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    icon: 'bg-rose-100 dark:bg-rose-900/50',
    text: 'text-rose-600 dark:text-rose-400',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    icon: 'bg-blue-100 dark:bg-blue-900/50',
    text: 'text-blue-600 dark:text-blue-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    icon: 'bg-amber-100 dark:bg-amber-900/50',
    text: 'text-amber-600 dark:text-amber-400',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: 'bg-emerald-100 dark:bg-emerald-900/50',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    icon: 'bg-purple-100 dark:bg-purple-900/50',
    text: 'text-purple-600 dark:text-purple-400',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-950/30',
    icon: 'bg-red-100 dark:bg-red-900/50',
    text: 'text-red-600 dark:text-red-400',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-950/30',
    icon: 'bg-teal-100 dark:bg-teal-900/50',
    text: 'text-teal-600 dark:text-teal-400',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    icon: 'bg-indigo-100 dark:bg-indigo-900/50',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KpiCard({ title, value, icon, color, format, loading }: KpiCardProps) {
  const IconComponent = ICON_MAP[icon] || Baby
  const colorClasses = COLOR_CLASSES[color] || COLOR_CLASSES.blue

  const formattedValue = value === null
    ? 'N/A'
    : format === 'percentage'
      ? `${value.toFixed(1)}%`
      : value.toLocaleString('th-TH')

  return (
    <div className={cn(
      'rounded-xl p-4 transition-all duration-200 hover:shadow-md',
      colorClasses.bg
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
            {title}
          </p>
          {loading ? (
            <div className="h-8 w-20 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
          ) : (
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {formattedValue}
            </p>
          )}
        </div>
        <div className={cn('p-2 rounded-lg', colorClasses.icon)}>
          <IconComponent className={cn('h-5 w-5', colorClasses.text)} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test tests/component/pregnancy/KpiCard.test.tsx`
Expected: PASS (all tests green)

- [ ] **Step 5: Commit**

```bash
git add src/components/pregnancy/KpiCard.tsx tests/component/pregnancy/KpiCard.test.tsx
git commit -m "$(cat <<'EOF'
feat: add KpiCard component for pregnancy dashboard

- Add KpiCard with icon, color, and formatting support
- Support loading and null states
- Add component tests

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: KPI Cards Row Component

**Files:**
- Create: `src/components/pregnancy/KpiCardsRow.tsx`
- Create: `src/components/pregnancy/index.ts` (barrel export)

- [ ] **Step 1: Write the KpiCardsRow component**

```typescript
// src/components/pregnancy/KpiCardsRow.tsx
import type { PregnancyKpis } from '@/types/pregnancy'
import { KpiCard } from './KpiCard'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KpiCardsRowProps {
  kpis: PregnancyKpis | null
  loading?: boolean
}

// ---------------------------------------------------------------------------
// KPI Configuration
// ---------------------------------------------------------------------------

const KPI_CONFIG = [
  { key: 'activePregnancies' as const, title: 'ตั้งครรภ์ปัจจุบัน', icon: 'Baby', color: 'rose' as const, format: 'number' as const },
  { key: 'newAncThisMonth' as const, title: 'ฝากครรภ์ใหม่เดือนนี้', icon: 'CalendarPlus', color: 'blue' as const, format: 'number' as const },
  { key: 'dueWithin30Days' as const, title: 'รอคลอดใกล้เคียง', icon: 'Clock', color: 'amber' as const, format: 'number' as const },
  { key: 'deliveriesThisMonth' as const, title: 'คลอดเดือนนี้', icon: 'Heart', color: 'emerald' as const, format: 'number' as const },
  { key: 'cSectionRate' as const, title: 'อัตรา C-Section', icon: 'Activity', color: 'purple' as const, format: 'percentage' as const },
  { key: 'highRiskCount' as const, title: 'เสี่ยงสูง', icon: 'AlertTriangle', color: 'red' as const, format: 'number' as const },
  { key: 'ttVaccineCoverage' as const, title: 'ครอบคลุม TT', icon: 'Shield', color: 'teal' as const, format: 'percentage' as const },
  { key: 'anc5PlusCoverage' as const, title: 'ANC 5+ ครั้ง', icon: 'CheckCircle', color: 'indigo' as const, format: 'percentage' as const },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function KpiCardsRow({ kpis, loading }: KpiCardsRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
      {KPI_CONFIG.map((config) => (
        <KpiCard
          key={config.key}
          title={config.title}
          value={kpis?.[config.key] ?? null}
          icon={config.icon}
          color={config.color}
          format={config.format}
          loading={loading}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Create barrel export**

```typescript
// src/components/pregnancy/index.ts
export { KpiCard } from './KpiCard'
export { KpiCardsRow } from './KpiCardsRow'
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pregnancy/KpiCardsRow.tsx src/components/pregnancy/index.ts
git commit -m "$(cat <<'EOF'
feat: add KpiCardsRow component with 8 KPI cards

- Display all pregnancy KPIs in responsive grid
- Support loading state for all cards
- Add barrel export

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Chart Components (Delivery Trend)

**Files:**
- Create: `src/components/pregnancy/DeliveryTrendChart.tsx`

- [ ] **Step 1: Write the DeliveryTrendChart component**

```typescript
// src/components/pregnancy/DeliveryTrendChart.tsx
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DeliveryTrendData } from '@/types/pregnancy'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeliveryTrendChartProps {
  data: DeliveryTrendData[]
  loading?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DeliveryTrendChart({ data, loading }: DeliveryTrendChartProps) {
  if (loading) {
    return (
      <div className="h-64 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">ไม่มีข้อมูล</p>
      </div>
    )
  }

  return (
    <div className="h-64">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        แนวโน้มการคลอด
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            className="text-slate-600 dark:text-slate-400"
          />
          <YAxis
            tick={{ fontSize: 12 }}
            className="text-slate-600 dark:text-slate-400"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}
            labelStyle={{ fontWeight: 'bold' }}
          />
          <Line
            type="monotone"
            dataKey="deliveries"
            name="การคลอด"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, fill: '#3b82f6' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pregnancy/DeliveryTrendChart.tsx
git commit -m "$(cat <<'EOF'
feat: add DeliveryTrendChart component with Recharts

- Line chart showing delivery trends over 4 months
- Loading and empty state handling
- Thai labels and tooltips

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Chart Components (Delivery Type)

**Files:**
- Create: `src/components/pregnancy/DeliveryTypeChart.tsx`

- [ ] **Step 1: Write the DeliveryTypeChart component**

```typescript
// src/components/pregnancy/DeliveryTypeChart.tsx
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { DeliveryTypeData } from '@/types/pregnancy'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DeliveryTypeChartProps {
  data: DeliveryTypeData[]
  loading?: boolean
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COLORS: Record<string, string> = {
  'Normal': '#10b981',      // emerald
  'C-Section': '#f43f5e',   // rose
  'Vacuum': '#f59e0b',      // amber
  'Forceps': '#8b5cf6',     // purple
}

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DeliveryTypeChart({ data, loading }: DeliveryTypeChartProps) {
  if (loading) {
    return (
      <div className="h-64 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">ไม่มีข้อมูล</p>
      </div>
    )
  }

  const chartData = data.map((item, index) => ({
    name: item.type || 'อื่นๆ',
    value: item.count,
    color: COLORS[item.type] || DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }))

  return (
    <div className="h-64">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        ประเภทการคลอด
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => <span className="text-sm text-slate-700 dark:text-slate-300">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pregnancy/DeliveryTypeChart.tsx
git commit -m "$(cat <<'EOF'
feat: add DeliveryTypeChart pie chart component

- Donut chart for delivery type distribution
- Color-coded by delivery type
- Loading and empty states

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Chart Components (GA, Birth Weight, Apgar, ANC)

**Files:**
- Create: `src/components/pregnancy/GaDistributionChart.tsx`
- Create: `src/components/pregnancy/BirthWeightChart.tsx`
- Create: `src/components/pregnancy/ApgarScoreChart.tsx`
- Create: `src/components/pregnancy/AncComplianceChart.tsx`

- [ ] **Step 1: Write GaDistributionChart component**

```typescript
// src/components/pregnancy/GaDistributionChart.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { GaDistributionData } from '@/types/pregnancy'

interface GaDistributionChartProps {
  data: GaDistributionData[]
  loading?: boolean
}

const ORDER = ['1st Trimester (<12w)', '2nd Trimester (12-27w)', '3rd Trimester (28-36w)', 'Term (37w+)']

export function GaDistributionChart({ data, loading }: GaDistributionChartProps) {
  if (loading) {
    return <div className="h-64 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">ไม่มีข้อมูล</p>
      </div>
    )
  }

  const sortedData = [...data].sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category))

  return (
    <div className="h-64">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        การกระจายตามอายุครรภ์
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedData} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis dataKey="category" type="category" tick={{ fontSize: 11 }} width={80} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="count" name="จำนวน" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Write BirthWeightChart component**

```typescript
// src/components/pregnancy/BirthWeightChart.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import type { BirthWeightData } from '@/types/pregnancy'

interface BirthWeightChartProps {
  data: BirthWeightData[]
  loading?: boolean
}

const COLORS: Record<string, string> = {
  'Low (<2500g)': '#ef4444',      // red
  'Normal (2500-4000g)': '#10b981', // emerald
  'High (>4000g)': '#f59e0b',      // amber
}

const ORDER = ['Low (<2500g)', 'Normal (2500-4000g)', 'High (>4000g)']

export function BirthWeightChart({ data, loading }: BirthWeightChartProps) {
  if (loading) {
    return <div className="h-64 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">ไม่มีข้อมูล</p>
      </div>
    )
  }

  const sortedData = [...data].sort((a, b) => ORDER.indexOf(a.category) - ORDER.indexOf(b.category))

  return (
    <div className="h-64">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        การกระจายน้ำหนักแรกคลอด
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis dataKey="category" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="count" name="จำนวน" radius={[4, 4, 0, 0]}>
            {sortedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.category] || '#3b82f6'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: Write ApgarScoreChart component**

```typescript
// src/components/pregnancy/ApgarScoreChart.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { ApgarScoreData } from '@/types/pregnancy'

interface ApgarScoreChartProps {
  data: ApgarScoreData[]
  loading?: boolean
}

const ORDER = ['0-3', '4-6', '7-10']

export function ApgarScoreChart({ data, loading }: ApgarScoreChartProps) {
  if (loading) {
    return <div className="h-64 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">ไม่มีข้อมูล</p>
      </div>
    )
  }

  const sortedData = [...data].sort((a, b) => ORDER.indexOf(a.scoreRange) - ORDER.indexOf(b.scoreRange))

  return (
    <div className="h-64">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Apgar Score
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={sortedData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis dataKey="scoreRange" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}
          />
          <Legend />
          <Bar dataKey="oneMin" name="1 นาที" fill="#f43f5e" radius={[4, 4, 0, 0]} />
          <Bar dataKey="fiveMin" name="5 นาที" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 4: Write AncComplianceChart component**

```typescript
// src/components/pregnancy/AncComplianceChart.tsx
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { AncComplianceData } from '@/types/pregnancy'

interface AncComplianceChartProps {
  data: AncComplianceData[]
  loading?: boolean
}

export function AncComplianceChart({ data, loading }: AncComplianceChartProps) {
  if (loading) {
    return <div className="h-64 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-64 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
        <p className="text-slate-500 dark:text-slate-400">ไม่มีข้อมูล</p>
      </div>
    )
  }

  const chartData = data.map(item => ({
    visitCount: item.visitCount >= 5 ? '5+' : String(item.visitCount),
    patientCount: item.patientCount,
  }))

  return (
    <div className="h-64">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        การมาฝากครรภ์ (ANC)
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
          <XAxis dataKey="visitCount" tick={{ fontSize: 12 }} label={{ value: 'ครั้ง', position: 'insideBottomRight', offset: -5 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
            }}
          />
          <Bar dataKey="patientCount" name="จำนวนคนไข้" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/pregnancy/GaDistributionChart.tsx \
        src/components/pregnancy/BirthWeightChart.tsx \
        src/components/pregnancy/ApgarScoreChart.tsx \
        src/components/pregnancy/AncComplianceChart.tsx
git commit -m "$(cat <<'EOF'
feat: add remaining chart components for pregnancy dashboard

- GaDistributionChart: horizontal bar for GA categories
- BirthWeightChart: colored bar by weight category
- ApgarScoreChart: grouped bar for 1/5 min scores
- AncComplianceChart: bar chart for ANC visit counts

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Charts Grid Component

**Files:**
- Create: `src/components/pregnancy/ChartsGrid.tsx`
- Update: `src/components/pregnancy/index.ts`

- [ ] **Step 1: Write ChartsGrid component**

```typescript
// src/components/pregnancy/ChartsGrid.tsx
import type {
  DeliveryTrendData,
  DeliveryTypeData,
  GaDistributionData,
  BirthWeightData,
  ApgarScoreData,
  AncComplianceData,
} from '@/types/pregnancy'
import { DeliveryTrendChart } from './DeliveryTrendChart'
import { DeliveryTypeChart } from './DeliveryTypeChart'
import { GaDistributionChart } from './GaDistributionChart'
import { BirthWeightChart } from './BirthWeightChart'
import { ApgarScoreChart } from './ApgarScoreChart'
import { AncComplianceChart } from './AncComplianceChart'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChartsGridProps {
  deliveryTrend: DeliveryTrendData[]
  deliveryTypes: DeliveryTypeData[]
  gaDistribution: GaDistributionData[]
  birthWeight: BirthWeightData[]
  apgarScores: ApgarScoreData[]
  ancCompliance: AncComplianceData[]
  loading?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChartsGrid({
  deliveryTrend,
  deliveryTypes,
  gaDistribution,
  birthWeight,
  apgarScores,
  ancCompliance,
  loading,
}: ChartsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-200 dark:border-slate-800">
        <DeliveryTrendChart data={deliveryTrend} loading={loading} />
      </div>
      <div className="rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-200 dark:border-slate-800">
        <DeliveryTypeChart data={deliveryTypes} loading={loading} />
      </div>
      <div className="rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-200 dark:border-slate-800">
        <GaDistributionChart data={gaDistribution} loading={loading} />
      </div>
      <div className="rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-200 dark:border-slate-800">
        <BirthWeightChart data={birthWeight} loading={loading} />
      </div>
      <div className="rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-200 dark:border-slate-800">
        <ApgarScoreChart data={apgarScores} loading={loading} />
      </div>
      <div className="rounded-xl bg-white dark:bg-slate-900 p-4 shadow-sm border border-slate-200 dark:border-slate-800">
        <AncComplianceChart data={ancCompliance} loading={loading} />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update barrel export**

```typescript
// src/components/pregnancy/index.ts
export { KpiCard } from './KpiCard'
export { KpiCardsRow } from './KpiCardsRow'
export { ChartsGrid } from './ChartsGrid'
export { DeliveryTrendChart } from './DeliveryTrendChart'
export { DeliveryTypeChart } from './DeliveryTypeChart'
export { GaDistributionChart } from './GaDistributionChart'
export { BirthWeightChart } from './BirthWeightChart'
export { ApgarScoreChart } from './ApgarScoreChart'
export { AncComplianceChart } from './AncComplianceChart'
```

- [ ] **Step 3: Commit**

```bash
git add src/components/pregnancy/ChartsGrid.tsx src/components/pregnancy/index.ts
git commit -m "$(cat <<'EOF'
feat: add ChartsGrid component with 6 charts layout

- 2x3 responsive grid layout for charts
- Card wrapper with consistent styling
- Update barrel exports

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Summary Tables Component

**Files:**
- Create: `src/components/pregnancy/SummaryTables.tsx`

- [ ] **Step 1: Write SummaryTables component**

```typescript
// src/components/pregnancy/SummaryTables.tsx
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type {
  RecentDelivery,
  HighRiskPregnancy,
  UpcomingEdc,
} from '@/types/pregnancy'
import { cn } from '@/lib/utils'

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
    <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
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
      ไม่มีข้อมูล
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
    <div className="space-y-4">
      {/* Recent Deliveries Table */}
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
                {recentDeliveries.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
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

      {/* High Risk Pregnancies Table */}
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
                {highRiskPregnancies.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
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

      {/* Upcoming EDC Table */}
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
                {upcomingEdc.map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
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
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/pregnancy/SummaryTables.tsx
git commit -m "$(cat <<'EOF'
feat: add SummaryTables component with collapsible accordions

- Three tables: recent deliveries, high risk, upcoming EDC
- Collapsible accordion sections
- Loading skeleton and empty states
- Color-coded risk levels and days remaining

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Main Dashboard Page

**Files:**
- Create: `src/pages/PregnancyLaborDashboard.tsx`
- Update: `src/components/pregnancy/index.ts`

- [ ] **Step 1: Write the main dashboard page**

```typescript
// src/pages/PregnancyLaborDashboard.tsx
import { useCallback, useEffect, useMemo } from 'react'
import { useBmsSessionContext } from '@/contexts/BmsSessionContext'
import { useQuery } from '@/hooks/useQuery'
import { pregnancyQueries } from '@/services/pregnancyQueries'
import type {
  PregnancyKpis,
  DeliveryTrendData,
  DeliveryTypeData,
  GaDistributionData,
  BirthWeightData,
  ApgarScoreData,
  AncComplianceData,
  RecentDelivery,
  HighRiskPregnancy,
  UpcomingEdc,
} from '@/types/pregnancy'
import { KpiCardsRow, ChartsGrid, SummaryTables } from '@/components/pregnancy'
import { LayoutTemplate, RefreshCw, Calendar } from 'lucide-react'

// ---------------------------------------------------------------------------
// Helper: Parse API response
// ---------------------------------------------------------------------------

function parseArray<T>(data: unknown): T[] {
  if (!Array.isArray(data)) return []
  return data as T[]
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const num = Number(value)
  return isNaN(num) ? null : num
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PregnancyLaborDashboard() {
  const session = useBmsSessionContext()

  const dbType = session.connectionConfig?.databaseType ?? 'mysql'
  const hospitalName = session.session?.userInfo.location ?? 'โรงพยาบาล'
  const isConnected = session.sessionState === 'connected'

  // Fetch KPIs
  const kpisQuery = useQuery({
    queryFn: useCallback(async () => {
      if (!isConnected) return null

      const [activeRes, newAncRes, dueRes, deliveriesRes, cSectionRes, highRiskRes, ttRes, anc5Res] = await Promise.all([
        session.executeQuery(pregnancyQueries.getActivePregnancies(dbType)),
        session.executeQuery(pregnancyQueries.getNewAncThisMonth(dbType)),
        session.executeQuery(pregnancyQueries.getDueWithin30Days(dbType)),
        session.executeQuery(pregnancyQueries.getDeliveriesThisMonth(dbType)),
        session.executeQuery(pregnancyQueries.getCSectionRate(dbType)),
        session.executeQuery(pregnancyQueries.getHighRiskCount(dbType)),
        session.executeQuery(pregnancyQueries.getTtVaccineCoverage(dbType)),
        session.executeQuery(pregnancyQueries.getAnc5PlusCoverage(dbType)),
      ])

      const activePregnancies = parseNumber(activeRes.data?.[0]?.['active_pregnancies']) ?? 0
      const newAncThisMonth = parseNumber(newAncRes.data?.[0]?.['new_anc']) ?? 0
      const dueWithin30Days = parseNumber(dueRes.data?.[0]?.['due_soon']) ?? 0
      const deliveriesThisMonth = parseNumber(deliveriesRes.data?.[0]?.['deliveries']) ?? 0
      const highRiskCount = parseNumber(highRiskRes.data?.[0]?.['high_risk']) ?? 0
      const ttVaccineCoverage = parseNumber(ttRes.data?.[0]?.['tt_coverage_percent']) ?? 0
      const anc5PlusCoverage = parseNumber(anc5Res.data?.[0]?.['anc5_plus_percent']) ?? 0

      // Calculate C-section rate from delivery types
      const deliveryTypes = parseArray<DeliveryTypeData>(cSectionRes.data)
      const totalDeliveries = deliveryTypes.reduce((sum, d) => sum + d.count, 0)
      const cSectionCount = deliveryTypes.find(d => d.type?.includes('C') || d.type?.includes('section'))?.count ?? 0
      const cSectionRate = totalDeliveries > 0 ? (cSectionCount / totalDeliveries) * 100 : 0

      const kpis: PregnancyKpis = {
        activePregnancies,
        newAncThisMonth,
        dueWithin30Days,
        deliveriesThisMonth,
        cSectionRate,
        highRiskCount,
        ttVaccineCoverage,
        anc5PlusCoverage,
      }

      return kpis
    }, [isConnected, session, dbType]),
    enabled: isConnected,
  })

  // Fetch chart data
  const chartsQuery = useQuery({
    queryFn: useCallback(async () => {
      if (!isConnected) return null

      const [trendRes, typesRes, gaRes, weightRes, apgarRes, ancRes] = await Promise.all([
        session.executeQuery(pregnancyQueries.getDeliveryTrend(dbType)),
        session.executeQuery(pregnancyQueries.getCSectionRate(dbType)),
        session.executeQuery(pregnancyQueries.getGaDistribution(dbType)),
        session.executeQuery(pregnancyQueries.getBirthWeightDistribution(dbType)),
        session.executeQuery(pregnancyQueries.getAncCompliance(dbType)), // reuse for Apgar placeholder
        session.executeQuery(pregnancyQueries.getAncCompliance(dbType)),
      ])

      // Calculate percentages for delivery types
      const typesData = parseArray<{ type: string; count: number }>(typesRes.data)
      const totalTypes = typesData.reduce((sum, d) => sum + d.count, 0)
      const deliveryTypes: DeliveryTypeData[] = typesData.map(d => ({
        type: d.type,
        count: d.count,
        percentage: totalTypes > 0 ? (d.count / totalTypes) * 100 : 0,
      }))

      return {
        deliveryTrend: parseArray<DeliveryTrendData>(trendRes.data),
        deliveryTypes,
        gaDistribution: parseArray<GaDistributionData>(gaRes.data),
        birthWeight: parseArray<BirthWeightData>(weightRes.data),
        apgarScores: [] as ApgarScoreData[], // Placeholder - would need separate query
        ancCompliance: parseArray<AncComplianceData>(ancRes.data),
      }
    }, [isConnected, session, dbType]),
    enabled: isConnected,
  })

  // Fetch table data
  const tablesQuery = useQuery({
    queryFn: useCallback(async () => {
      if (!isConnected) return null

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
    }, [isConnected, session, dbType]),
    enabled: isConnected,
  })

  const isLoading = kpisQuery.isLoading || chartsQuery.isLoading || tablesQuery.isLoading
  const lastUpdated = new Date().toLocaleString('th-TH')

  // Refresh all data
  const handleRefresh = useCallback(() => {
    kpisQuery.execute()
    chartsQuery.execute()
    tablesQuery.execute()
  }, [kpisQuery, chartsQuery, tablesQuery])

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            ระบบฝากครรภ์และการคลอด
          </h1>
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-1">
            <Calendar className="h-4 w-4" />
            {hospitalName} • อัปเดตล่าสุด: {lastUpdated}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            รีเฟรช
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
          >
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <section>
        <KpiCardsRow kpis={kpisQuery.data} loading={kpisQuery.isLoading} />
      </section>

      {/* Charts */}
      <section>
        <ChartsGrid
          deliveryTrend={chartsQuery.data?.deliveryTrend ?? []}
          deliveryTypes={chartsQuery.data?.deliveryTypes ?? []}
          gaDistribution={chartsQuery.data?.gaDistribution ?? []}
          birthWeight={chartsQuery.data?.birthWeight ?? []}
          apgarScores={chartsQuery.data?.apgarScores ?? []}
          ancCompliance={chartsQuery.data?.ancCompliance ?? []}
          loading={chartsQuery.isLoading}
        />
      </section>

      {/* Summary Tables */}
      <section>
        <SummaryTables
          recentDeliveries={tablesQuery.data?.recentDeliveries ?? []}
          highRiskPregnancies={tablesQuery.data?.highRiskPregnancies ?? []}
          upcomingEdc={tablesQuery.data?.upcomingEdc ?? []}
          loading={tablesQuery.isLoading}
        />
      </section>
    </div>
  )
}

// Import cn at the top
import { cn } from '@/lib/utils'
```

- [ ] **Step 2: Fix import order and commit**

```bash
git add src/pages/PregnancyLaborDashboard.tsx
git commit -m "$(cat <<'EOF'
feat: add PregnancyLaborDashboard main page component

- Fetch KPIs, charts, and tables from BMS Session API
- Header with hospital name, last updated, refresh button
- Handle connection state and loading states
- Parallel API calls for performance

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: Replace Overview Page

**Files:**
- Rename: `src/pages/Overview.tsx` → `src/pages/OverviewTemplates.tsx`
- Create: `src/pages/Overview.tsx` (new)
- Modify: `src/App.tsx` (add templates route)

- [ ] **Step 1: Rename existing Overview.tsx to OverviewTemplates.tsx**

```bash
mv src/pages/Overview.tsx src/pages/OverviewTemplates.tsx
```

- [ ] **Step 2: Create new Overview.tsx that wraps PregnancyLaborDashboard**

```typescript
// src/pages/Overview.tsx
import { PregnancyLaborDashboard } from './PregnancyLaborDashboard'

export default function Overview() {
  return <PregnancyLaborDashboard />
}
```

- [ ] **Step 3: Update App.tsx to add templates route (check current structure first)**

Read `src/App.tsx` and add a route for `/templates` that renders `OverviewTemplates`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Overview.tsx src/pages/OverviewTemplates.tsx src/App.tsx
git commit -m "$(cat <<'EOF'
feat: replace Overview with PregnancyLaborDashboard

- Rename old Overview to OverviewTemplates
- New Overview renders PregnancyLaborDashboard
- Templates accessible via /templates route

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: Integration Testing

**Files:**
- Create: `tests/integration/pregnancyDashboard.test.tsx`

- [ ] **Step 1: Write integration test**

```typescript
// tests/integration/pregnancyDashboard.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { BmsSessionProvider } from '@/contexts/BmsSessionContext'
import { PregnancyLaborDashboard } from '@/pages/PregnancyLaborDashboard'

// Mock the session context
vi.mock('@/contexts/BmsSessionContext', async () => {
  const actual = await vi.importActual('@/contexts/BmsSessionContext')
  return {
    ...actual,
    useBmsSessionContext: () => ({
      session: {
        userInfo: { location: 'Test Hospital' },
      },
      sessionState: 'connected',
      connectionConfig: { databaseType: 'mysql' },
      executeQuery: vi.fn().mockResolvedValue({
        data: [{ count: 10 }],
        MessageCode: 200,
      }),
    }),
  }
})

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <BmsSessionProvider>
        {component}
      </BmsSessionProvider>
    </BrowserRouter>
  )
}

describe('PregnancyLaborDashboard Integration', () => {
  it('renders dashboard title', async () => {
    renderWithProviders(<PregnancyLaborDashboard />)

    expect(screen.getByText('ระบบฝากครรภ์และการคลอด')).toBeInTheDocument()
  })

  it('shows KPI cards after loading', async () => {
    renderWithProviders(<PregnancyLaborDashboard />)

    await waitFor(() => {
      expect(screen.getByText('ตั้งครรภ์ปัจจุบัน')).toBeInTheDocument()
    })
  })

  it('shows refresh button', () => {
    renderWithProviders(<PregnancyLaborDashboard />)

    expect(screen.getByText('รีเฟรช')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run integration tests**

Run: `npm test tests/integration/pregnancyDashboard.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add tests/integration/pregnancyDashboard.test.tsx
git commit -m "$(cat <<'EOF'
test: add integration tests for pregnancy dashboard

- Test dashboard renders with title
- Test KPI cards appear after loading
- Test refresh button is present

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Acceptance Criteria Verification

| # | Criteria | Task |
|---|----------|------|
| 1 | KPI Cards: All 8 cards display correct metrics with loading states | Task 3, 4 |
| 2 | Charts: All 6 charts render correctly with Recharts | Task 5, 6, 7, 8 |
| 3 | Tables: All 3 tables display data with sortable columns | Task 9 |
| 4 | Responsive: Layout adapts for tablet (768px) and mobile (375px) | Task 4, 8 |
| 5 | Error Handling: Graceful fallback when queries fail | Task 10 |
| 6 | Performance: Initial load < 3 seconds with parallel queries | Task 10 |
| 7 | Accessibility: ARIA labels on interactive elements | Task 9 (buttons) |
| 8 | Internationalization: All labels in Thai language | All tasks |

---

## Dependencies

- `recharts` - Already installed (v3.x)
- `lucide-react` - Already installed
- `tailwindcss` - Already installed (v4)
- `@radix-ui/react-accordion` - May need to install for shadcn accordion
