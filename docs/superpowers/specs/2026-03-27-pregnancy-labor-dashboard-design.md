# Pregnancy & Labor Dashboard Design Specification

> **Created**: 2026-03-27
> **Status**: Approved for Implementation
> **Purpose**: Replace main Overview dashboard with pregnancy/labor focused analytics

---

## 1. Overview

### 1.1 Purpose
Create an informative dashboard displaying pregnancy and labor patient data from HOSxP hospital systems. The dashboard will serve both **clinical operations** (real-time tracking) and **statistical reporting** (historical trends).

### 1.2 Target Users
- Hospital administrators
- OB-GYN department staff
- ANC clinic nurses
- Labor room staff
- Quality assurance teams

### 1.3 Scope
- **Time Period**: Current month + last 3 months (rolling 4 months)
- **Data Sources**: HOSxP PostgreSQL database via BMS Session API
- **Layout Style**: Executive Dashboard (KPI cards + Charts + Tables)

---

## 2. Data Architecture

### 2.1 Primary Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `person_anc` | ANC registration | `person_anc_id`, `person_id`, `anc_register_date`, `lmp`, `edc`, `labor_date`, `labor_status_id`, `has_risk`, `risk_level` |
| `person_anc_preg_care` | ANC visits | `person_anc_preg_care_id`, `person_anc_id`, `care_date`, `bps`, `bpd`, `uterus_level_normal` |
| `person_labour` | Labor/delivery records | `person_id`, `gravida`, `birth_weight`, `apgar_score_1`, `apgar_score_5`, `has_asphyxia`, `ga` |
| `person_labour_type` | Delivery type lookup | `person_labour_type_id`, `person_labour_type_name` |
| `labor_status` | Labor status lookup | `labor_status_id`, `labor_status_name` |
| `person` | Person demographics | `person_id`, `hn`, `pname`, `fname`, `lname`, `sex`, `birthday` |
| `anc_risk` | Risk factor lookup | `anc_risk_id`, `anc_risk_name`, `anc_risk_fatal` |

### 2.2 Key SQL Queries

> **Cross-Database Compatibility**: The BMS Session API returns `bms_database_type` (MySQL/PostgreSQL).
> The application should detect the database type and use the appropriate SQL syntax.
> Queries below show both MySQL and PostgreSQL versions where syntax differs.

#### 2.2.1 Active Pregnancies (Current)
```sql
-- Compatible with both MySQL and PostgreSQL
SELECT COUNT(*) as active_pregnancies
FROM person_anc pa
WHERE pa.labor_date IS NULL
  AND (pa.discharge IS NULL OR pa.discharge = 'N')
```

#### 2.2.2 New ANC Registrations This Month
```sql
-- PostgreSQL
SELECT COUNT(*) as new_anc
FROM person_anc pa
WHERE pa.anc_register_date >= DATE_TRUNC('month', CURRENT_DATE)

-- MySQL
SELECT COUNT(*) as new_anc
FROM person_anc pa
WHERE pa.anc_register_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
```

#### 2.2.3 Due Within 30 Days (EDC)
```sql
-- PostgreSQL
SELECT COUNT(*) as due_soon
FROM person_anc pa
WHERE pa.labor_date IS NULL
  AND pa.edc BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'

-- MySQL
SELECT COUNT(*) as due_soon
FROM person_anc pa
WHERE pa.labor_date IS NULL
  AND pa.edc BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
```

#### 2.2.4 Deliveries This Month
```sql
-- PostgreSQL
SELECT COUNT(*) as deliveries
FROM person_labour pl
JOIN person_anc pa ON pl.person_id = pa.person_id
WHERE pa.labor_date >= DATE_TRUNC('month', CURRENT_DATE)

-- MySQL
SELECT COUNT(*) as deliveries
FROM person_labour pl
JOIN person_anc pa ON pl.person_id = pa.person_id
WHERE pa.labor_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
```

#### 2.2.5 C-Section Rate
```sql
-- PostgreSQL
SELECT
  plt.person_labour_type_name,
  COUNT(*) as count
FROM person_labour pl
JOIN person_anc pa ON pl.person_id = pa.person_id
JOIN person_labour_type plt ON pl.person_labour_type_id = plt.person_labour_type_id
WHERE pa.labor_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'
GROUP BY plt.person_labour_type_name

-- MySQL
SELECT
  plt.person_labour_type_name,
  COUNT(*) as count
FROM person_labour pl
JOIN person_anc pa ON pl.person_id = pa.person_id
JOIN person_labour_type plt ON pl.person_labour_type_id = plt.person_labour_type_id
WHERE pa.labor_date >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 3 MONTH)
GROUP BY plt.person_labour_type_name
```

#### 2.2.6 High Risk Pregnancies
```sql
-- Compatible with both
SELECT COUNT(*) as high_risk
FROM person_anc pa
WHERE pa.has_risk = 'Y'
  AND pa.labor_date IS NULL
```

#### 2.2.7 TT Vaccine Coverage
```sql
-- Compatible with both
SELECT
  ROUND(
    COUNT(CASE WHEN pa.vaccine_tt_complete = 'Y' THEN 1 END) * 100.0 /
    NULLIF(COUNT(*), 0)
  , 1) as tt_coverage_percent
FROM person_anc pa
WHERE pa.labor_date >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 3 MONTH)
  OR pa.labor_date IS NULL
```

#### 2.2.8 ANC 5+ Visits Coverage
```sql
-- PostgreSQL
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
  WHERE pa.labor_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'
  GROUP BY pa.person_anc_id
) sub

-- MySQL
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
  WHERE pa.labor_date >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 3 MONTH)
  GROUP BY pa.person_anc_id
) sub
```

#### 2.2.9 Delivery Trend (Last 4 Months)
```sql
-- PostgreSQL
SELECT
  TO_CHAR(pa.labor_date, 'YYYY-MM') as month,
  COUNT(*) as deliveries
FROM person_anc pa
WHERE pa.labor_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'
GROUP BY TO_CHAR(pa.labor_date, 'YYYY-MM')
ORDER BY month

-- MySQL
SELECT
  DATE_FORMAT(pa.labor_date, '%Y-%m') as month,
  COUNT(*) as deliveries
FROM person_anc pa
WHERE pa.labor_date >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 3 MONTH)
GROUP BY DATE_FORMAT(pa.labor_date, '%Y-%m')
ORDER BY month
```

#### 2.2.10 Birth Weight Distribution
```sql
-- Compatible with both
SELECT
  CASE
    WHEN pl.birth_weight < 2500 THEN 'Low (<2500g)'
    WHEN pl.birth_weight > 4000 THEN 'High (>4000g)'
    ELSE 'Normal (2500-4000g)'
  END as weight_category,
  COUNT(*) as count
FROM person_labour pl
JOIN person_anc pa ON pl.person_id = pa.person_id
WHERE pa.labor_date >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 3 MONTH)
GROUP BY weight_category
```

#### 2.2.11 GA Distribution (Current Pregnancies)
```sql
-- PostgreSQL
SELECT
  CASE
    WHEN ga < 12 THEN '1st Trimester (<12w)'
    WHEN ga < 28 THEN '2nd Trimester (12-27w)'
    WHEN ga < 37 THEN '3rd Trimester (28-36w)'
    ELSE 'Term (37w+)'
  END as ga_category,
  COUNT(*) as count
FROM (
  SELECT
    FLOOR(EXTRACT(DAYS FROM (CURRENT_DATE - pa.lmp::date)) / 7) as ga
  FROM person_anc pa
  WHERE pa.labor_date IS NULL
    AND pa.lmp IS NOT NULL
) sub
GROUP BY ga_category

-- MySQL
SELECT
  CASE
    WHEN ga < 12 THEN '1st Trimester (<12w)'
    WHEN ga < 28 THEN '2nd Trimester (12-27w)'
    WHEN ga < 37 THEN '3rd Trimester (28-36w)'
    ELSE 'Term (37w+)'
  END as ga_category,
  COUNT(*) as count
FROM (
  SELECT
    FLOOR(DATEDIFF(CURDATE(), pa.lmp) / 7) as ga
  FROM person_anc pa
  WHERE pa.labor_date IS NULL
    AND pa.lmp IS NOT NULL
) sub
GROUP BY ga_category
```

#### 2.2.12 ANC Visit Compliance
```sql
-- PostgreSQL
SELECT
  visit_count,
  COUNT(*) as patient_count
FROM (
  SELECT
    pa.person_anc_id,
    COUNT(papc.person_anc_preg_care_id) as visit_count
  FROM person_anc pa
  LEFT JOIN person_anc_preg_care papc ON pa.person_anc_id = papc.person_anc_id
  WHERE pa.labor_date >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '3 months'
  GROUP BY pa.person_anc_id
) sub
GROUP BY visit_count
ORDER BY visit_count

-- MySQL
SELECT
  visit_count,
  COUNT(*) as patient_count
FROM (
  SELECT
    pa.person_anc_id,
    COUNT(papc.person_anc_preg_care_id) as visit_count
  FROM person_anc pa
  LEFT JOIN person_anc_preg_care papc ON pa.person_anc_id = papc.person_anc_id
  WHERE pa.labor_date >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 3 MONTH)
  GROUP BY pa.person_anc_id
) sub
GROUP BY visit_count
ORDER BY visit_count
```

#### 2.2.13 Recent Deliveries Table (Last 30 days)
```sql
-- PostgreSQL
SELECT
  pa.labor_date,
  p.hn,
  CONCAT(p.pname, p.fname, ' ', p.lname) as patient_name,
  pl.ga,
  plt.person_labour_type_name as delivery_type,
  pl.birth_weight,
  pl.apgar_score_1,
  pl.apgar_score_5
FROM person_labour pl
JOIN person_anc pa ON pl.person_id = pa.person_id
JOIN person p ON pa.person_id = p.person_id
LEFT JOIN person_labour_type plt ON pl.person_labour_type_id = plt.person_labour_type_id
WHERE pa.labor_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY pa.labor_date DESC
LIMIT 50

-- MySQL
SELECT
  pa.labor_date,
  p.hn,
  CONCAT(p.pname, p.fname, ' ', p.lname) as patient_name,
  pl.ga,
  plt.person_labour_type_name as delivery_type,
  pl.birth_weight,
  pl.apgar_score_1,
  pl.apgar_score_5
FROM person_labour pl
JOIN person_anc pa ON pl.person_id = pa.person_id
JOIN person p ON pa.person_id = p.person_id
LEFT JOIN person_labour_type plt ON pl.person_labour_type_id = plt.person_labour_type_id
WHERE pa.labor_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
ORDER BY pa.labor_date DESC
LIMIT 50
```

#### 2.2.14 High-Risk Pregnancies Table
```sql
-- Compatible with both (use TIMESTAMPDIFF for MySQL, date arithmetic for PostgreSQL)
SELECT
  p.hn,
  CONCAT(p.pname, p.fname, ' ', p.lname) as patient_name,
  pa.edc,
  pa.risk_level,
  pa.risk_list
FROM person_anc pa
JOIN person p ON pa.person_id = p.person_id
WHERE pa.has_risk = 'Y'
  AND pa.labor_date IS NULL
ORDER BY pa.edc ASC
LIMIT 50
```

#### 2.2.15 Upcoming EDC Table (Within 30 days)
```sql
-- PostgreSQL
SELECT
  p.hn,
  CONCAT(p.pname, p.fname, ' ', p.lname) as patient_name,
  pa.edc,
  (pa.edc - CURRENT_DATE) as days_remaining
FROM person_anc pa
JOIN person p ON pa.person_id = p.person_id
WHERE pa.labor_date IS NULL
  AND pa.edc BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
ORDER BY pa.edc ASC

-- MySQL
SELECT
  p.hn,
  CONCAT(p.pname, p.fname, ' ', p.lname) as patient_name,
  pa.edc,
  DATEDIFF(pa.edc, CURDATE()) as days_remaining
FROM person_anc pa
JOIN person p ON pa.person_id = p.person_id
WHERE pa.labor_date IS NULL
  AND pa.edc BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
ORDER BY pa.edc ASC
```

---

## 3. UI Components

### 3.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                         HEADER SECTION                               │
│  Title: ระบบฝากครรภ์และการคลอด | Hospital Name | Last Updated        │
├─────────────────────────────────────────────────────────────────────┤
│                       KPI CARDS ROW (8 cards)                        │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │ KPI │ │ KPI │ │ KPI │ │ KPI │ │ KPI │ │ KPI │ │ KPI │ │ KPI │   │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘   │
├─────────────────────────────────────────────────────────────────────┤
│                        CHARTS SECTION (2x3 grid)                     │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐        │
│  │ Delivery Trend  │ │ Delivery Types  │ │ GA Distribution │        │
│  │   (Line Chart)  │ │   (Pie Chart)   │ │   (Bar Chart)   │        │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐        │
│  │ Birth Weight    │ │  Apgar Scores   │ │ ANC Compliance  │        │
│  │   (Bar Chart)   │ │   (Bar Chart)   │ │   (Bar Chart)   │        │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘        │
├─────────────────────────────────────────────────────────────────────┤
│                    SUMMARY TABLES (Collapsible Accordion)            │
│  ▼ การคลอดล่าสุด (Recent Deliveries)                                  │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │ Date | HN | Name | GA | Delivery Type | Birth Wt | Apgar   │  │
│    └─────────────────────────────────────────────────────────────┘  │
│  ▶ หญิงตั้งครรภ์เสี่ยงสูง (High-Risk Pregnancies)                      │
│  ▶ รอคลอดใกล้เคียง (Upcoming EDC within 30 days)                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 KPI Cards Detail

| # | Card Title | Icon | Metric | Color |
|---|------------|------|--------|-------|
| 1 | ตั้งครรภ์ปัจจุบัน | Baby | Active pregnancies count | rose-500 |
| 2 | ฝากครรภ์ใหม่เดือนนี้ | CalendarPlus | New ANC this month | blue-500 |
| 3 | รอคลอดใกล้เคียง | Clock | Due within 30 days | amber-500 |
| 4 | คลอดเดือนนี้ | Heart | Deliveries this month | emerald-500 |
| 5 | อัตรา C-Section | Activity | C-section % | purple-500 |
| 6 | เสี่ยงสูง | AlertTriangle | High risk count | red-500 |
| 7 | ครอบคลุม TT | Shield | TT vaccine % | teal-500 |
| 8 | ANC 5+ ครั้ง | CheckCircle | ANC 5+ visits % | indigo-500 |

### 3.3 Charts Detail

#### Chart 1: Delivery Trend (Line Chart)
- **Type**: Line chart with markers
- **X-axis**: Months (last 4 months)
- **Y-axis**: Delivery count
- **Color**: Primary blue gradient

#### Chart 2: Delivery Type Distribution (Pie Chart)
- **Type**: Donut chart with legend
- **Segments**: Normal, C-Section, Vacuum, Forceps
- **Colors**: emerald, rose, amber, purple

#### Chart 3: GA Distribution (Bar Chart)
- **Type**: Horizontal bar chart
- **Categories**: 1st Trimester, 2nd Trimester, 3rd Trimester, Term
- **Color**: Blue gradient by category

#### Chart 4: Birth Weight Distribution (Bar Chart)
- **Type**: Vertical bar chart
- **Categories**: Low (<2500g), Normal (2500-4000g), High (>4000g)
- **Colors**: red, emerald, amber

#### Chart 5: Apgar Score Distribution (Grouped Bar)
- **Type**: Grouped bar chart
- **Categories**: 1-min Apgar, 5-min Apgar
- **Groups**: 0-3, 4-6, 7-10
- **Colors**: rose, emerald

#### Chart 6: ANC Visit Compliance (Bar Chart)
- **Type**: Vertical bar chart
- **Categories**: 1, 2, 3, 4, 5+ visits
- **Color**: Indigo gradient

### 3.4 Summary Tables Detail

#### Table 1: Recent Deliveries (Recent 30 days)
| Column | Source | Width |
|--------|--------|-------|
| วันที่คลอด | `labor_date` | 100px |
| HN | `person.hn` | 80px |
| ชื่อ-สกุล | `pname, fname, lname` | 180px |
| GA (สัปดาห์) | `ga` | 80px |
| ประเภทคลอด | `person_labour_type_name` | 120px |
| น้ำหนัก (g) | `birth_weight` | 100px |
| Apgar 1/5 | `apgar_score_1, apgar_score_5` | 80px |

#### Table 2: High-Risk Pregnancies
| Column | Source | Width |
|--------|--------|-------|
| HN | `person.hn` | 80px |
| ชื่อ-สกุล | `pname, fname, lname` | 180px |
| GA (สัปดาห์) | Calculated from LMP | 80px |
| EDC | `edc` | 100px |
| ระดับความเสี่ยง | `risk_level` | 100px |

#### Table 3: Upcoming EDC (Within 30 days)
| Column | Source | Width |
|--------|--------|-------|
| HN | `person.hn` | 80px |
| ชื่อ-สกุล | `pname, fname, lname` | 180px |
| GA (สัปดาห์) | Calculated from LMP | 80px |
| EDC | `edc` | 100px |
| วันที่เหลือ | Calculated: EDC - today | 80px |

---

## 4. Component Architecture

### 4.1 File Structure

```
src/
├── pages/
│   └── PregnancyLaborDashboard.tsx    # Main dashboard page (replaces Overview)
├── components/
│   └── pregnancy/
│       ├── KpiCardsRow.tsx            # 8 KPI cards container
│       ├── KpiCard.tsx                # Individual KPI card component
│       ├── ChartsGrid.tsx             # 6 charts container
│       ├── DeliveryTrendChart.tsx     # Line chart
│       ├── DeliveryTypeChart.tsx      # Pie chart
│       ├── GaDistributionChart.tsx    # Bar chart
│       ├── BirthWeightChart.tsx       # Bar chart
│       ├── ApgarScoreChart.tsx        # Grouped bar chart
│       ├── AncComplianceChart.tsx     # Bar chart
│       └── SummaryTables.tsx          # Collapsible tables
├── services/
│   └── pregnancyQueries.ts            # SQL queries and data fetching
└── types/
    └── pregnancy.ts                   # TypeScript interfaces
```

### 4.2 Data Flow

```
BmsSessionContext
       │
       ▼
PregnancyLaborDashboard
       │
       ├── useQuery(pregnancyQueries.getKpis())
       │         │
       │         ▼
       │    KpiCardsRow
       │
       ├── useQuery(pregnancyQueries.getCharts())
       │         │
       │         ▼
       │    ChartsGrid
       │
       └── useQuery(pregnancyQueries.getTables())
                 │
                 ▼
            SummaryTables
```

### 4.3 TypeScript Interfaces

```typescript
// types/pregnancy.ts

interface PregnancyKpis {
  activePregnancies: number;
  newAncThisMonth: number;
  dueWithin30Days: number;
  deliveriesThisMonth: number;
  cSectionRate: number;
  highRiskCount: number;
  ttVaccineCoverage: number;
  anc5PlusCoverage: number;
}

interface DeliveryTrendData {
  month: string;
  deliveries: number;
}

interface DeliveryTypeData {
  type: string;
  count: number;
  percentage: number;
}

interface GaDistributionData {
  category: string;
  count: number;
}

interface BirthWeightData {
  category: string;
  count: number;
}

interface ApgarScoreData {
  scoreRange: string;
  oneMin: number;
  fiveMin: number;
}

interface AncComplianceData {
  visitCount: number;
  patientCount: number;
}

interface RecentDelivery {
  laborDate: string;
  hn: string;
  patientName: string;
  ga: number;
  deliveryType: string;
  birthWeight: number;
  apgar1: number;
  apgar5: number;
}

interface HighRiskPregnancy {
  hn: string;
  patientName: string;
  ga: number;
  edc: string;
  riskLevel: number;
}

interface UpcomingEdc {
  hn: string;
  patientName: string;
  ga: number;
  edc: string;
  daysRemaining: number;
}
```

---

## 5. Error Handling

### 5.1 Query Errors
- Display fallback "N/A" for individual KPIs when query fails
- Show error toast with retry option
- Log errors to console with query context

### 5.2 Empty States
- KPI cards show "0" with muted styling when no data
- Charts show "No data available" placeholder
- Tables show empty state with message

### 5.3 Loading States
- KPI cards show skeleton during initial load
- Charts show placeholder shimmer
- Tables show loading skeleton rows

---

## 6. Performance Considerations

### 6.1 Query Optimization
- Use `LIMIT` clauses on all queries
- Combine related queries where possible
- Use indexed columns (dates, foreign keys)
- Cache results in React state during session

### 6.2 Rendering Optimization
- Memoize chart components with `React.memo`
- Use `useMemo` for derived data calculations
- Lazy load tables (render on accordion expand)

---

## 7. Acceptance Criteria

1. **KPI Cards**: All 8 cards display correct metrics with loading states
2. **Charts**: All 6 charts render correctly with Recharts
3. **Tables**: All 3 tables display data with sortable columns
4. **Responsive**: Layout adapts for tablet (768px) and mobile (375px)
5. **Error Handling**: Graceful fallback when queries fail
6. **Performance**: Initial load < 3 seconds on typical data volume
7. **Accessibility**: ARIA labels on interactive elements
8. **Internationalization**: All labels in Thai language

---

## 8. Implementation Notes

### 8.1 Replace Overview Page
**Approach: Replace the Overview.tsx content directly**
- The current `Overview.tsx` shows template cards for generating dashboards
- Replace its content with `PregnancyLaborDashboard` component
- Keep template functionality accessible via a "Templates" button in the header
- This gives users immediate access to pregnancy/labor data on the main page

### 8.2 Chart Library
- Use Recharts 3.x (already in project dependencies)
- ResponsiveContainer for responsive charts
- Custom tooltips with Thai labels

### 8.3 Styling
- Use Tailwind CSS v4 (already in project)
- Follow existing card/gradient patterns from current Overview
- shadcn/ui components for tables and accordions
