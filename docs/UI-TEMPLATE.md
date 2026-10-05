# UX/UI Template — HOSxP Analytics Dashboard

ต้นแบบ UX/UI จากระบบ **Telemed Analytics** สำหรับนำไปสร้างแดชบอร์ดตัวอื่นบน BMS Session API (เช่น ER, IPD, Lab, ทันตกรรม) ให้หน้าตาและพฤติกรรมเป็นชุดเดียวกัน

> อ่านคู่กับ `CLAUDE.md` (สถาปัตยกรรม, BMS Session, กฎการพัฒนา) และ `docs/BMS-SESSION-FOR-DEV.md` (API)
> โค้ดอ้างอิงจริงอยู่ใน `src/index.css`, `src/components/telemed/*`, `src/components/layout/*`, `src/components/session/*`

---

## สารบัญ

1. [หลักการออกแบบ](#1-หลักการออกแบบ)
2. [Tech stack](#2-tech-stack)
3. [Design tokens](#3-design-tokens)
4. [Typography](#4-typography)
5. [Surface, radius, shadow](#5-surface-radius-shadow)
6. [Layout ของหน้า](#6-layout-ของหน้า)
7. [Components](#7-components)
8. [กราฟ](#8-กราฟ)
9. [Pattern ของข้อมูลและ UX](#9-pattern-ของข้อมูลและ-ux)
10. [Responsive และ Accessibility](#10-responsive-และ-accessibility)
11. [การเขียนข้อความ (ภาษาไทย)](#11-การเขียนข้อความ-ภาษาไทย)
12. [ข้อควรระวังที่เจอจริง](#12-ข้อควรระวังที่เจอจริง)
13. [Checklist เริ่มโปรเจกต์ใหม่](#13-checklist-เริ่มโปรเจกต์ใหม่)

---

## 1. หลักการออกแบบ

| หลักการ | ความหมายในทางปฏิบัติ |
|---|---|
| **ขาวสว่าง minimal** | พื้นหลังไล่จากขาวไปขาวควันบุหรี่ การ์ดเป็นขาวทึบลอยด้วยเงานุ่ม ไม่มีลายพื้นหลังยกเว้นใน Hero |
| **Light-only** | ไม่มี dark mode ห้ามใช้ `dark:` ของ Tailwind (ดู [ข้อ 12](#12-ข้อควรระวังที่เจอจริง)) |
| **สีเน้นเดียว** | Teal เป็น primary ทุกอย่างที่กดได้ใช้สีนี้ สีอื่นใช้เพื่อ "แยกหมวด" เท่านั้น |
| **หนึ่งหมวด หนึ่งสี** | แต่ละหมวดข้อมูล (เช่น บริการ, แผนก) มีสีและไอคอนประจำ ใช้ตรงกันทั้งการ์ด กราฟ ตาราง modal |
| **สรุปก่อน รายละเอียดทีหลัง** | การ์ดตัวเลข → กราฟแนวโน้ม → ตาราง → modal |
| **ทุกตัวเลขคลิกดูที่มาได้** | การ์ดและแท่งกราฟเปิด modal ที่อธิบายวิธีคำนวณ |
| **ดึงครั้งเดียว คำนวณฝั่ง client** | หนึ่ง query ต่อหนึ่งช่วงเวลา ทุกมุมมอง (เทียบปี, modal, CSV) คำนวณจากข้อมูลที่ถืออยู่ |
| **ไม่มีข้อมูลรายบุคคลถ้าไม่จำเป็น** | ให้ฐานข้อมูลรวมยอด (`COUNT`, `SUM`) แล้วส่งกลับเฉพาะตัวเลข |
| **ภาษาไทยเป็นหลัก** | ปี พ.ศ., เดือนย่อไทย, ปีงบประมาณ |

---

## 2. Tech stack

```
React 19 + TypeScript (strict) + Vite
Tailwind CSS v4 (@tailwindcss/vite)       — utility + token
Recharts 3                                 — กราฟ
lucide-react                               — ไอคอน
shadcn/ui (Dialog เท่านั้นที่ใช้จริง)       — modal
date-fns + locale th                       — วันที่
Vitest + Testing Library                   — test
```

ฟอนต์: **Noto Sans Thai** ตัวเดียว โหลดจาก Google Fonts ใน `index.html`

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
<meta name="theme-color" content="#ffffff" />
<meta name="color-scheme" content="light" />
```

---

## 3. Design tokens

วางทั้งก้อนนี้ใน `src/index.css` ค่าสีเป็น HSL แบบ shadcn (`H S% L%`) แล้ว map เป็น utility ของ Tailwind ผ่าน `@theme`

```css
@import "tailwindcss";

@theme {
  --font-sans: 'Noto Sans Thai', system-ui, -apple-system, sans-serif;
}

@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-popover: hsl(var(--popover));
  --color-popover-foreground: hsl(var(--popover-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-smoke: hsl(var(--smoke));
  /* สีประจำหมวด: เปลี่ยนชื่อตามโดเมนของระบบใหม่ */
  --color-cat-1: hsl(var(--cat-1));
  --color-cat-2: hsl(var(--cat-2));
  --color-cat-3: hsl(var(--cat-3));
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222 28% 14%;          /* #1a2233 ตัวอักษรหลัก */
    --card: 0 0% 100%;
    --card-foreground: 222 28% 14%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 28% 14%;
    --primary: 175 84% 32%;             /* #0d9488 teal-600 */
    --primary-foreground: 0 0% 100%;
    --secondary: 220 14% 96%;
    --secondary-foreground: 222 28% 14%;
    --muted: 220 14% 96%;               /* #f3f4f6 */
    --muted-foreground: 220 9% 46%;     /* #6b7280 ตัวอักษรรอง */
    --accent: 172 60% 95%;              /* #ebf8f6 พื้น teal อ่อน */
    --accent-foreground: 175 84% 24%;
    --destructive: 0 72% 51%;
    --border: 220 13% 91%;              /* #e5e7eb */
    --input: 220 13% 91%;
    --ring: 175 84% 32%;
    --radius: 0.75rem;

    --smoke: 220 12% 95%;               /* #f1f2f4 ปลายทางของ gradient */

    --cat-1: 199 89% 48%;               /* sky    #0ea5e9 */
    --cat-2: 234 89% 74%;               /* indigo #818cf8 */
    --cat-3: 173 80% 40%;               /* teal   #14b8a6 */
  }
}

@layer base {
  * { border-color: hsl(var(--border)); }

  body {
    min-height: 100vh;
    margin: 0;
    color: hsl(var(--foreground));
    background-color: hsl(var(--smoke));
    background-image: linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(220 14% 98%) 45%, hsl(var(--smoke)) 100%);
    background-attachment: fixed;
    font-family: var(--font-sans);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  :focus-visible { outline: 2px solid hsl(var(--ring)); outline-offset: 2px; border-radius: 4px; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

### ตารางสี

| บทบาท | Token / Tailwind | Hex | ใช้กับ |
|---|---|---|---|
| ตัวอักษรหลัก | `text-foreground` | `#1a2233` | หัวข้อ, ตัวเลข |
| ตัวอักษรรอง | `text-muted-foreground` | `#6b7280` | คำอธิบาย, label, แกนกราฟ |
| Primary | `bg-primary` / `text-primary` | `#0d9488` | ปุ่มหลัก, ไอคอน section, focus ring |
| Accent อ่อน | `bg-accent` | `#ebf8f6` | พื้นกล่องไอคอน, hover แถวตาราง, callout |
| เส้นขอบ | `border-border` | `#e5e7eb` | การ์ด, ตาราง |
| Smoke | `bg-smoke` | `#f1f2f4` | ปลาย gradient พื้นหน้า |
| หมวด 1–3 | `bg-cat-1..3` | sky / indigo / teal | การ์ด, แท่งกราฟ, จุดในตาราง |
| เพิ่มขึ้น | `bg-emerald-50 text-emerald-700` | | badge % บวก |
| ลดลง | `bg-rose-50 text-rose-700` | | badge % ลบ, error |
| เตือน | `bg-amber-50 text-amber-600` | | session หมดอายุ |

> **สีประจำหมวด** ถ้ามีมากกว่า 3 หมวด เพิ่มจาก `violet-400`, `amber-400`, `rose-400` ตามลำดับ และเก็บไว้ในไฟล์เดียว (ดู `serviceTheme.ts` ในข้อ 7.4)

> **NCD Clinic Dashboard ใช้ชุดสีอื่น:** คู่ sky/indigo ข้างบนแยกไม่ออกสำหรับผู้ที่ตาบอดสี จึงใช้ชุดสีที่ผ่าน `validate_palette.js` แทน (DM = น้ำเงิน, HT = ส้ม, คลินิกและสิทธิใช้ `--cat-3`–`--cat-7`) ดู `docs/adr/0003-colour-blind-safe-palette.md` และ `src/components/ncd/visuals.ts`

---

## 4. Typography

| ระดับ | Class | ใช้กับ |
|---|---|---|
| H1 หน้า | `text-2xl sm:text-3xl font-semibold tracking-tight` | หัวข้อใน Hero (มีหน้าละครั้ง) |
| H2 section | `text-base font-semibold tracking-tight` | หัวการ์ด section |
| ตัวเลขเด่น | `text-3xl font-semibold tabular-nums tracking-tight` (การ์ดรวม) / `text-2xl` (การ์ดย่อย) | KPI |
| เนื้อหา | `text-sm leading-relaxed text-muted-foreground` | คำอธิบาย |
| Label | `text-xs text-muted-foreground` | ป้ายกำกับตัวเลข, หัวตาราง |
| ตัวเล็กสุด | `text-[11px]` | หมายเหตุใต้การ์ด |

- ตัวเลขทุกตัวที่เรียงเป็นคอลัมน์ใส่ `tabular-nums`
- ใช้น้ำหนักแค่ 400 / 500 / 600 ไม่ใช้ 700 กับภาษาไทย (หนาเกินไป)
- หัวข้อใช้ `tracking-tight` ตัวอักษรไทยไม่ต้องใส่ letter-spacing เพิ่ม

---

## 5. Surface, radius, shadow

class `.surface` คือการ์ดมาตรฐานของทั้งระบบ **ต้องอยู่ใน `@layer components`** เพื่อให้ utility ของ Tailwind override ได้

```css
@layer components {
  .surface {
    background: hsl(var(--card));
    border: 1px solid hsl(var(--border) / 0.7);
    border-radius: 1.25rem;
    box-shadow:
      0 1px 2px rgb(15 23 42 / 0.04),
      0 12px 32px -18px rgb(15 23 42 / 0.14);
  }

  .surface-interactive {
    cursor: pointer;
    transition: box-shadow .25s cubic-bezier(.4,0,.2,1), transform .25s cubic-bezier(.4,0,.2,1), border-color .25s ease;
  }
  .surface-interactive:hover {
    transform: translateY(-2px);
    border-color: hsl(var(--primary) / 0.25);
    box-shadow: 0 2px 4px rgb(15 23 42 / .05), 0 20px 40px -20px rgb(15 23 42 / .2);
  }
}

@keyframes rise-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-rise-in { animation: rise-in .45s cubic-bezier(.4,0,.2,1) both; }
```

| สิ่งของ | Radius |
|---|---|
| การ์ด / section / hero | `1.25rem` (`.surface`) |
| modal | `rounded-2xl` |
| ปุ่ม, input, select, กล่องไอคอน | `rounded-xl` |
| badge, pill, toggle | `rounded-full` |

เงามี 2 ระดับเท่านั้น: ปกติ (`.surface`) และ hover (`.surface-interactive:hover`) tooltip/toast ใช้ `shadow-[0_12px_32px_-12px_rgb(15_23_42/0.25)]`

---

## 6. Layout ของหน้า

### โครงแอป

```
┌───────────────────────────────────────────────┐
│ Header (sticky, กระจกขาว, h-16)                │
├───────────────────────────────────────────────┤
│ <main> max-w-7xl px-4 sm:px-6 py-6 lg:py-8     │
│   space-y-6                                    │
│   1. Hero                                      │
│   2. Toolbar  (ตัวเลือกช่วงเวลา | รีเฟรช CSV)    │
│   3. KPI cards  grid sm:2 xl:4                  │
│   4. กราฟแนวโน้ม (SectionCard)                  │
│   5. ตารางสรุป (SectionCard)                    │
│   6. หมายเหตุแหล่งข้อมูล (text-xs กลางหน้า)       │
└───────────────────────────────────────────────┘
```

```tsx
// src/components/layout/AppLayout.tsx — layout โปร่งใส gradient อยู่ที่ <body>
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}

// หน้าแต่ละหน้า
<div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">…</div>
```

### สถานะของหน้า (แสดงทีละสถานะ)

```tsx
{isError && <SectionCard title="เกิดข้อผิดพลาด"><ErrorState message={…} onRetry={retry} /></SectionCard>}
{isLoading && <SectionCard title="กำลังโหลดข้อมูล"><LoadingState /></SectionCard>}
{empty && <SectionCard title="ไม่พบข้อมูล"><EmptyState … action={{ label: 'ดูปีงบก่อนหน้า', onClick }} /></SectionCard>}
{ready && <>…เนื้อหา…</>}
```

Hero และ Toolbar แสดงตลอด ผู้ใช้จึงเปลี่ยนช่วงเวลาได้แม้อยู่ในสถานะ error หรือ empty

---

## 7. Components

### 7.1 BrandMark (โลโก้)

กล่อง gradient teal→sky มีไอคอน SVG ของโดเมน ใช้ใน header, หน้า login, หน้าเชื่อมต่อ และ favicon (ทำเป็นไฟล์ SVG แยก)

```tsx
const SIZES = { sm: 'h-9 w-9 rounded-xl', md: 'h-11 w-11 rounded-2xl', lg: 'h-14 w-14 rounded-2xl' } as const;

export function BrandMark({ size = 'sm' }: { size?: keyof typeof SIZES }) {
  return (
    <span aria-hidden="true" className={cn(
      'grid shrink-0 place-items-center bg-linear-to-br from-teal-500 to-sky-500 text-white',
      'shadow-[0_8px_20px_-8px_rgb(13_148_136/0.65)]', SIZES[size])}>
      <svg viewBox="0 0 24 24" fill="none" className="h-[58%] w-[58%]">{/* ไอคอนของระบบ */}</svg>
    </span>
  );
}
```

### 7.2 Header

```tsx
<header className="sticky top-0 z-50 border-b border-border/60 bg-white/70 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
  <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
    {/* ซ้าย: BrandMark + ชื่อระบบ + คำอธิบาย (ซ่อนบนมือถือ) */}
    {/* ขวา: pill "เชื่อมต่อแล้ว" (md+) · badge ฐานข้อมูล (lg+) · ชิปผู้ใช้ · ปุ่มออกจากระบบ */}
  </div>
</header>
```

- Pill สถานะ: `rounded-full border-emerald-100 bg-emerald-50/80 text-emerald-700` มีจุด `animate-ping`
- ชิปผู้ใช้: avatar วงกลม gradient teal→sky ตัวอักษรแรกของชื่อ
- ปุ่มออกจากระบบ: โปร่งใส hover เป็น `bg-rose-50 text-rose-600` ข้อความซ่อนบนจอเล็กกว่า md
- **ไม่ใส่แท็บนำทาง** ถ้าระบบมีหน้าเดียว

### 7.3 Hero

การ์ดเดียวที่มีลายพื้นหลัง (คลื่นหัวใจจางๆ) และภาพประกอบ

```tsx
<section className="surface animate-rise-in relative isolate overflow-hidden bg-linear-to-br from-white via-white to-teal-50/60">
  {/* ลาย ECG: SVG pattern opacity 0.07 อยู่หลังข้อความ (-z-10) */}
  {/* วงแสงสีฟ้ามุมขวาบน: absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl */}
  <div className="grid items-center gap-6 px-6 py-7 sm:grid-cols-[1fr_auto] sm:px-8 sm:py-8">
    <div className="min-w-0">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-white/80 px-3 py-1 text-xs font-medium text-teal-700">
        <Stethoscope className="h-3.5 w-3.5" /> หมวดระบบ · HOSxP
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">หัวข้อเชิงเนื้อหา</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        <span className="font-medium text-primary">ปีงบประมาณ 2569</span> · 1 ต.ค. 2568 – 30 ก.ย. 2569
      </p>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">อธิบายว่าหน้านี้ช่วยตอบคำถามอะไร</p>
    </div>
    <Illustration className="hidden h-auto w-[300px] sm:block lg:w-[340px]" />
  </div>
</section>
```

**ภาพประกอบ**: SVG inline สไตล์ "การ์ดลอย" มีวงแสงพื้นหลัง, การ์ดขาวที่มี `feDropShadow`, เส้นประเชื่อมระหว่างการ์ด และเครื่องหมาย + เล็กๆ ใช้สีจาก palette เท่านั้น (teal, sky, indigo, slate) ใส่ `aria-hidden="true"` ทุกครั้ง และใช้ `useId()` ตั้ง id ของ gradient/filter (ดูตัวอย่าง `TelemedIllustration.tsx`)

### 7.4 สีและไอคอนประจำหมวด

เก็บไว้ในไฟล์เดียว ทุก component อ่านจากที่นี่

```ts
// serviceTheme.ts
export type Tone = CategoryKey | 'total';

export const VISUALS: Record<Tone, { icon: LucideIcon; color: string; tile: string; dot: string }> = {
  total: { icon: Activity, color: 'hsl(var(--primary))',
           tile: 'bg-linear-to-br from-teal-500 to-sky-500 text-white shadow-[0_8px_20px_-8px_rgb(13_148_136/0.6)]',
           dot: 'bg-primary' },
  cat1:  { icon: Hospital,  color: 'hsl(var(--cat-1))', tile: 'bg-sky-50 text-sky-600 ring-1 ring-sky-100',          dot: 'bg-cat-1' },
  cat2:  { icon: Video,     color: 'hsl(var(--cat-2))', tile: 'bg-indigo-50 text-indigo-500 ring-1 ring-indigo-100', dot: 'bg-cat-2' },
  cat3:  { icon: PhoneCall, color: 'hsl(var(--cat-3))', tile: 'bg-teal-50 text-teal-600 ring-1 ring-teal-100',       dot: 'bg-cat-3' },
};
```

เลือกไอคอนตาม **ความหมาย** ของหมวด (ใคร/ช่องทาง) ไม่ใช่ตามสี และต้องไม่ซ้ำกัน ลำดับการแสดงผลกำหนดครั้งเดียวในไฟล์ service แล้วใช้เหมือนกันทุกจุด

### 7.5 KPI Card

ทั้งการ์ดเป็นปุ่มเดียว (เปิด modal) ภายในใช้ `<span>` เท่านั้น เพราะ `<button>` ห้ามมี `<div>` หรือ `<dl>` ข้างใน

```
┌──────────────────────────────────┐
│ [ไอคอน] ชื่อหมวด               › │
│        คำอธิบายสั้น              │
│                                  │
│ Visit ทั้งหมด     จำนวนเงิน (บาท) │
│ 1,234            56,789          │
│ ↑ +15%           ↓ -2.5%         │
│ ──────────────────────────────── │
│ เทียบปีงบประมาณ 2568             │
└──────────────────────────────────┘
```

```tsx
<button type="button" onClick={onClick} aria-label={`${label} — ดูรายละเอียด`}
  className={cn('surface surface-interactive group relative flex w-full flex-col overflow-hidden p-5 text-left',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    featured && 'bg-linear-to-br from-white via-white to-teal-50/70')}>
  {/* วงสีจางของหมวดที่มุมขวาบน: absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.08] blur-2xl */}
  …
</button>
```

- การ์ด "รวมทั้งหมด" อยู่ซ้ายสุด ตัวเลขใหญ่กว่า (`text-3xl`) และไอคอนเป็น gradient
- Grid: `grid gap-4 sm:grid-cols-2 xl:grid-cols-4`
- ลูกศร `›` ขยับเมื่อ hover (`group-hover:translate-x-0.5 group-hover:text-primary`)

### 7.6 ChangeBadge

```tsx
export function ChangeBadge({ change }: { change: number | null }) {
  if (change === null) return <span className="text-xs text-muted-foreground">ไม่มีข้อมูลปีงบก่อน</span>;
  const up = change > 0, flat = change === 0;
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
      flat && 'bg-muted text-muted-foreground',
      !flat && up && 'bg-emerald-50 text-emerald-700',
      !flat && !up && 'bg-rose-50 text-rose-700')}>
      {!flat && (up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      <span>{formatChange(change)}</span>
    </span>
  );
}
```

ถ้าฐานเป็นศูนย์ให้คืน `null` แล้วแสดงข้อความ ห้ามแสดง `Infinity%` หรือ `+100%`

### 7.7 SectionCard

```tsx
<section className="surface animate-rise-in p-5 sm:p-6">
  <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
    <div className="flex min-w-0 items-start gap-3">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">{icon}</span>
      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
    <div className="shrink-0">{aside /* toggle หรือปุ่ม CSV */}</div>
  </header>
  {children}
</section>
```

คำอธิบายบอก **วิธีโต้ตอบ** ด้วย เช่น "แยกตามบริการ · คลิกแท่งเพื่อดูรายละเอียดของบริการนั้น"

### 7.8 Toolbar controls

| Component | หน้าตา |
|---|---|
| `ToolbarButton` | `rounded-xl border bg-card px-3 py-2 text-sm font-medium` hover เป็นขอบและตัวอักษร teal |
| `FiscalYearSelect` | `<label>` ห่อ native `<select>` มีไอคอนปฏิทิน teal ซ้าย ลูกศร SVG ขวา `appearance-none` และ `aria-label` |
| `SegmentedToggle` | `role="group"` ปุ่มใน pill `bg-muted/60` ปุ่มที่เลือกเป็น `bg-card shadow-sm` และใส่ `aria-pressed` |

ปุ่มรีเฟรชหมุนไอคอน (`animate-spin`) และ disabled ระหว่างโหลด ตัวเลือกช่วงเวลาก็ disabled ระหว่างโหลดเพื่อกัน response มาสลับลำดับ

### 7.9 ตารางสรุป

```tsx
<div className="-mx-2 overflow-x-auto px-2">
  <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
    <thead>   {/* text-xs text-muted-foreground; หัวคอลัมน์หมวดมีจุดสี */}
    <tbody>   {/* แถว hover:bg-accent/40; เดือนอนาคต text-muted-foreground/50 + data-future */}
    <tfoot>   {/* แถวรวม bg-accent/50 มุมโค้ง rounded-l-xl / rounded-r-xl; คอลัมน์รวมสุดท้าย text-primary */}
  </table>
</div>
```

- เซลล์สองบรรทัด: ค่าหลัก (font-medium) อยู่บน ค่ารอง (`text-xs text-muted-foreground`) อยู่ล่าง
- หัวแถวใช้ `<th scope="row">` แถวรวมก็เช่นกัน
- เดือนที่ยังมาไม่ถึงแสดง `—` ไม่ใช่ `0`

### 7.10 Detail Modal

ลำดับเนื้อหาใน modal (ใช้ shadcn `Dialog`):

1. **Header**: กล่องไอคอนของหมวด + ชื่อ + คำอธิบาย · ช่วงเวลา
2. **Callout วิธีคำนวณ**: `rounded-xl bg-accent/60 text-xs text-accent-foreground` พร้อมไอคอน `Info`
3. **ตัวเลขเทียบช่วงก่อน**: grid 4 ช่อง (ค่าปัจจุบัน, ค่าช่วงก่อน, ChangeBadge)
4. **กราฟแนวโน้ม**: Area สีของหมวด + เส้นประของช่วงก่อน มี toggle ตัวชี้วัด
5. **ตารางรายเดือน**: ทุกตัวชี้วัดที่ query คืนมา
6. **Footer**: ปุ่ม "ปิด" (`bg-primary`)

```tsx
<DialogContent className="max-h-[90vh] grid-cols-[minmax(0,1fr)] gap-6 overflow-y-auto rounded-2xl border-border/70 p-6 sm:max-w-3xl sm:p-7">
```

> ต้องใช้ `sm:max-w-3xl` ไม่ใช่ `max-w-3xl` (ดูข้อ 12) และใส่ `grid-cols-[minmax(0,1fr)]` เพื่อให้ตารางกว้างเลื่อนอยู่ใน modal

### 7.11 Loading / Error / Empty

| สถานะ | ไอคอน | ปุ่ม |
|---|---|---|
| Loading | วงหมุน `border-accent border-t-primary` + ข้อความว่ากำลังทำอะไร | ไม่มี |
| Error | `TriangleAlert` ในกล่อง `rounded-2xl bg-rose-50 text-rose-600` | "ลองใหม่" (`ToolbarButton`) |
| Empty | `Inbox` ในกล่อง `rounded-2xl bg-accent text-primary` | ปุ่มหลัก teal ที่พาไปมุมมองที่มีข้อมูล เช่น "ดูปีงบประมาณ 2568" |

ข้อความ error แปลงจาก error ทางเทคนิคเป็นภาษาคน:

```ts
if (/unauthorized|expired/i.test(msg)) return 'เซสชันหมดอายุ กรุณาเชื่อมต่อใหม่แล้วลองอีกครั้ง';
if (/timed out/i.test(msg))            return 'คำขอนานเกินไป กรุณาลองใหม่อีกครั้ง';
if (/unable to connect/i.test(msg))    return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาตรวจสอบเครือข่ายแล้วลองใหม่';
```

### 7.12 หน้า Login / Session Expired / กำลังเชื่อมต่อ

```
lg ขึ้นไป                                   มือถือ
┌──────────────────────┬────────────────┐   ┌──────────────┐
│ แผงแบรนด์ (1.1fr)     │ การ์ดฟอร์ม      │   │ BrandMark+ชื่อ │
│ BrandMark + ชื่อ      │  ไอคอนกุญแจ     │   │ การ์ดฟอร์ม     │
│ ภาพประกอบ             │  หัวข้อ + คำอธิบาย│   └──────────────┘
│ หัวข้อ gradient       │  input mono     │
│ การ์ดหมวด 3 ใบ        │  ปุ่ม teal เต็มกว้าง│
└──────────────────────┴────────────────┘
```

- Shell ร่วม (`AuthShell`) แผงซ้าย `bg-linear-to-br from-white via-teal-50/40 to-sky-50/60` และซ่อนบนจอเล็กกว่า lg
- Input: `rounded-xl border bg-white px-4 py-3 font-mono` focus เป็น `focus:border-primary/60 focus:ring-4 focus:ring-primary/10`
- ปุ่ม submit: `bg-linear-to-r from-teal-600 to-teal-500` เงาสี teal ยกขึ้น 1px เมื่อ hover
- Error: callout `rounded-xl border-rose-100 bg-rose-50/80` พร้อม `role="alert"`
- Session expired: ไอคอนกล่องสีเหลือง `bg-amber-50 text-amber-600 ring-amber-100`
- หน้ากำลังเชื่อมต่อ: BrandMark ขนาด lg มีวง `animate-ping` และวงหมุนรอบนอก

### 7.13 Toast

การ์ดขาว `rounded-xl border bg-white/95 backdrop-blur` เงา tooltip สีอยู่ที่ขอบและไอคอนเท่านั้น (`border-rose-100 [&>svg]:text-rose-500`)

---

## 8. กราฟ

| หัวข้อ | กติกา |
|---|---|
| ชนิด | แนวโน้มแยกหมวดใช้ `ComposedChart` + `Bar stackId` ส่วน modal รายหมวดใช้ `Area` gradient |
| สี | ใช้ `color` จาก `VISUALS` เท่านั้น |
| Grid | `strokeDasharray="3 6"` สี `hsl(var(--border))` เฉพาะแนวนอน |
| แกน | ไม่มีเส้นแกนและ tick line ตัวอักษร 11px `hsl(var(--muted-foreground))` |
| แกน Y | ย่อเลขเป็น `12.5k` / `1.3M` |
| แท่ง | `maxBarSize={36}`, `barCategoryGap="28%"` ใส่มุมโค้ง `[6,6,0,0]` เฉพาะชิ้นบนสุดของ stack |
| ช่วงก่อนหน้า | `Line` เส้นประ `5 5` สี muted ความทึบ 0.55 ไม่มีจุด |
| ช่วงที่ยังมาไม่ถึง | `ReferenceArea` สี `hsl(var(--muted))` และ legend "เดือนที่ยังไม่ถึง" |
| Tooltip | component เอง: การ์ดขาว `rounded-xl` แสดงค่าแต่ละหมวด, รวม, ช่วงก่อน |
| Legend | เขียนเองเป็น `<ul>` ใต้กราฟ ไม่ใช้ Legend ของ Recharts |
| คลิก | `Bar onClick` เปิด modal ของหมวดนั้น และใส่ `cursor="pointer"` |
| ความสูง | หน้า `h-72` · modal `h-52` |

> `Line` ต้องอยู่ใน `ComposedChart` ถ้าใส่ใน `AreaChart` จะไม่แสดงผล

---

## 9. Pattern ของข้อมูลและ UX

### 9.1 ปีงบประมาณ (พ.ศ.)

```ts
const BE_OFFSET = 543;
// ปีงบที่วันที่นี้อยู่: ต.ค.–ธ.ค. นับเป็นปีงบถัดไป
fiscalYearOf(date) = (date.getMonth() >= 9 ? date.getFullYear() + 1 : date.getFullYear()) + 543;
// ปีงบ 2569 → 2025-10-01 .. 2026-09-30
fiscalYearRange(fy) = { start: `${fy - 543 - 1}-10-01`, end: `${fy - 543}-09-30` };
// 12 เดือน ต.ค. → ก.ย.
fiscalMonths(fy): string[]
// ป้ายเดือน: '2025-10' → 'ต.ค. 68'
fiscalMonthLabel(month)
// ตัวเลือก: ปีปัจจุบัน + ย้อนหลัง 4 ปี
fiscalYearOptions(current, 5)
```

### 9.2 เทียบกับช่วงก่อน แบบเดือนต่อเดือน (YTD)

ถ้าปีงบยังไม่จบ ให้เทียบเฉพาะเดือนที่ผ่านไปแล้วกับเดือนเดียวกันของปีก่อน ห้ามเทียบกับทั้งปี

```ts
const n = elapsedMonths(fiscalYear, today);          // 0–12
const current  = summarizeSeries(series, n);
const previous = summarizeSeries(previousSeries, n);
const label = n >= 12 ? `เทียบปีงบประมาณ ${fy - 1}` : `เทียบ ต.ค.–ธ.ค. ของปีงบประมาณ ${fy - 1}`;
```

และบอกช่วงที่ใช้เทียบไว้ใต้การ์ดทุกใบ (`compareLabel`)

### 9.3 Query แบบสรุป

- ให้ฐานข้อมูลรวมยอด: `COUNT(*)`, `COUNT(DISTINCT vn)`, `SUM(...)`, `SUM(CASE WHEN … THEN 1 ELSE 0 END)`
- จัดกลุ่มเดือนด้วย `EXTRACT(YEAR FROM d)`, `EXTRACT(MONTH FROM d)` ใช้ได้ทั้ง PostgreSQL และ MySQL **ห้ามใช้ `TO_CHAR` หรือ `DATE_FORMAT`**
- วันที่ส่งเป็น parameter `:start_date` / `:end_date` (`value_type: 'date'`)
- ดึงครั้งเดียวให้ครอบทั้งช่วงที่เลือกและช่วงก่อนหน้า (เช่น 24 เดือน)
- ใส่ `LIMIT` เสมอ
- ถ้าต้องรวมยอดข้ามหมวด ให้มี query นับ `COUNT(DISTINCT vn)` ต่อเดือนแยก เพื่อไม่ให้นับซ้ำ
- Normalize ฝั่ง client: แปลง string → number (ตัด `,`), ทิ้งแถวที่ไม่มีเดือนหรือรหัสไม่รู้จัก

### 9.4 Series ที่มีครบทุกเดือน

`buildSeries()` คืนครบ 12 จุดเสมอ เดือนที่ไม่มีข้อมูลเป็นศูนย์ และมี `isFuture` ไว้ระบายสี แกนกราฟจึงคงที่ทุกปี

### 9.5 การจัดรูปแบบ

| ข้อมูล | รูปแบบ | Helper |
|---|---|---|
| จำนวน | `1,234` | `formatNumber` |
| เงิน | `56,789 บาท` (ในการ์ด: ตัวเลข + label "(บาท)") | `formatBaht` |
| % | `24.4%` ตัด `.0` | `formatPercent` |
| เปลี่ยนแปลง | `+15%` / `-2.5%` | `formatChange` |
| วันที่ | `1 ต.ค. 2568` | `formatThaiDate` |
| ไม่มีค่า | `—` | `NO_VALUE` |

### 9.6 CSV

- ชื่อไฟล์บอกช่วงข้อมูล: `<system>-fy2569.csv`
- คอลัมน์ตรงกับ query (snake_case) เรียงตามเดือนแล้วรหัส
- ขึ้นต้นด้วย BOM `﻿` เพื่อให้ Excel อ่านภาษาไทยถูก (เขียนเป็น escape อย่าวางตัวอักษร BOM ลงในโค้ด)
- Escape ตาม RFC-4180

### 9.7 Glossary

สร้าง `CONTEXT.md` นิยามคำในโดเมน (เช่น Visit, รายการ, ยอดเงิน, ปีงบประมาณ) ก่อนเขียน UI แล้วใช้คำเดียวกันทุก label

---

## 10. Responsive และ Accessibility

| Breakpoint | สิ่งที่เปลี่ยน |
|---|---|
| < 640px (มือถือ) | ซ่อนภาพประกอบใน Hero, ซ่อนคำอธิบายแบรนด์และชื่อผู้ใช้ใน header, การ์ด 1 คอลัมน์ |
| sm 640px | การ์ด 2 คอลัมน์, Hero 2 คอลัมน์ |
| md 768px | แสดง pill "เชื่อมต่อแล้ว" และข้อความปุ่มออกจากระบบ |
| lg 1024px | แสดง badge ฐานข้อมูล, หน้า login แบบแบ่งสองฝั่ง |
| xl 1280px | การ์ด 4 คอลัมน์ |

- ตารางกว้างอยู่ใน `overflow-x-auto` ของตัวเอง หน้าไม่เลื่อนแนวนอน
- ทุก SVG ตกแต่งใส่ `aria-hidden="true"`
- ปุ่มที่เป็นการ์ดมี `aria-label` ที่บอกการกระทำ (`"B2B — ดูรายละเอียด"`)
- Toggle ใช้ `aria-pressed` กลุ่มปุ่มใช้ `role="group"` + `aria-label`
- Select มี `aria-label` สถานะโหลดมี `role="status"` error ฟอร์มมี `role="alert"`
- Focus ring teal ทุก element ที่กดได้ (`focus-visible:ring-2 ring-ring ring-offset-2`)
- รองรับ `prefers-reduced-motion`
- ทุกอย่างที่กดได้มี `cursor-pointer`

---

## 11. การเขียนข้อความ (ภาษาไทย)

- หัวข้อหน้าเป็นเชิงเนื้อหา ("ภาพรวมบริการ Telemedicine") ส่วนชื่อแบรนด์อยู่ใน header ห้ามซ้ำกัน
- คำอธิบายใต้หัวข้อบอกทั้งความหมายและวิธีใช้ ("… · คลิกแท่งเพื่อดูรายละเอียด")
- ปุ่มเป็นกริยา: "รีเฟรช", "ลองใหม่", "เชื่อมต่อใหม่", "ดูปีงบประมาณ 2568"
- Empty state บอก 3 อย่าง: เกิดอะไรขึ้น, ทำไม, ทำอะไรต่อได้
- หน่วยอยู่ใน label ("จำนวนเงิน (บาท)") ตัวเลขจะได้สั้น
- ระบุที่มาข้อมูลท้ายหน้า ("ข้อมูลสรุปรายเดือนแบบอ่านอย่างเดียวจาก HOSxP · ไม่มีข้อมูลรายบุคคลของผู้ป่วย")

---

## 12. ข้อควรระวังที่เจอจริง

| ปัญหา | สาเหตุ | วิธีแก้ |
|---|---|---|
| Toast/component เปลี่ยนเป็นสีมืดเอง | Tailwind v4 ใช้ `dark:` ตาม `prefers-color-scheme` ของเครื่อง | ระบบ light-only ห้ามใช้ `dark:` และใส่ `<meta name="color-scheme" content="light">` |
| Utility ทับ `.surface` ไม่ได้ | CSS ที่ไม่อยู่ใน layer ชนะ `@layer utilities` | ใส่ class เองใน `@layer components` |
| Gradient ไม่ขึ้น | v4 เปลี่ยนชื่อ class | ใช้ `bg-linear-to-br` แทน `bg-gradient-to-br` |
| Modal แคบผิดปกติ | `DialogContent` มี `sm:max-w-lg` ซึ่งชนะ `max-w-3xl` | override ที่ breakpoint เดียวกัน: `sm:max-w-3xl` |
| ตารางใน modal ดันความกว้าง | grid item มี `min-width: auto` | `grid-cols-[minmax(0,1fr)]` |
| เส้นใน AreaChart ไม่แสดง | `Line` ใช้ได้เฉพาะใน `ComposedChart`/`LineChart` | ใช้ `ComposedChart` |
| SVG gradient ของสองการ์ดชนกัน | id ซ้ำ | ใช้ `useId()` ตั้ง id |
| `<div>` ใน `<button>` | HTML ไม่อนุญาต | ใช้ `<span className="block">` |
| SQL พังบน MySQL | `TO_CHAR` มีแค่ใน PostgreSQL | `EXTRACT(YEAR/MONTH FROM …)` |
| % ต้นปีงบติดลบมาก | เทียบ YTD กับทั้งปี | เทียบเดือนต่อเดือน (ข้อ 9.2) |
| ตัวอักษร BOM หายตอนแก้ไฟล์ | วางตัวอักษรที่มองไม่เห็นลงในโค้ด | เขียนเป็น `'﻿'` |
| `.mcp.json` เปลี่ยนทุกครั้งที่รัน dev | `vite-plugin-mcp` เขียนทับ | revert ก่อน commit หรือเปิด plugin เฉพาะโหมด `serve` |

---

## 13. Checklist เริ่มโปรเจกต์ใหม่

**ตั้งค่า**
- [ ] คัดลอก token block (ข้อ 3) และ `.surface` (ข้อ 5) ไปที่ `src/index.css`
- [ ] โหลด Noto Sans Thai และใส่ meta `color-scheme: light` ใน `index.html`
- [ ] ทำ favicon และ `BrandMark` ด้วยไอคอนของโดเมนใหม่
- [ ] เปลี่ยน `--cat-1..n` และ `VISUALS` ให้ตรงกับหมวดของระบบใหม่

**โดเมน**
- [ ] เขียน `CONTEXT.md` (คำศัพท์, หน่วยนับ, ช่วงเวลา)
- [ ] กำหนดรายการหมวด (key, รหัส, label, คำอธิบาย) และลำดับแสดงผลในไฟล์ service ไฟล์เดียว
- [ ] เขียน query สรุปด้วย `EXTRACT` + parameter + `LIMIT`

**หน้าจอ**
- [ ] Hero: หัวข้อเชิงเนื้อหา, ช่วงเวลา, คำอธิบาย, ภาพประกอบ SVG
- [ ] Toolbar: ตัวเลือกช่วงเวลา, รีเฟรช, CSV
- [ ] การ์ดรวม + การ์ดรายหมวด พร้อม ChangeBadge และ compareLabel
- [ ] กราฟแนวโน้ม (stacked) + เส้นช่วงก่อน + เดือนอนาคต
- [ ] ตารางสรุป + แถวรวม
- [ ] Modal รายละเอียดพร้อมวิธีคำนวณ
- [ ] สถานะ loading / error / empty ครบ

**คุณภาพ**
- [ ] Unit test: ฟังก์ชันปีงบ, SQL builder, normalize, series, CSV
- [ ] Component test: Hero, การ์ด, ตัวเลือกช่วงเวลา, ตาราง (เน้นข้อความและ aria ไม่ใช้ snapshot)
- [ ] `npx tsc -b` ผ่าน, lint ไม่มี error ใหม่
- [ ] ตรวจในเบราว์เซอร์ที่ 390px และ 1440px ต้องไม่มี console error
- [ ] เทียบตัวเลขกับ SQL ต้นฉบับบนฐานข้อมูลจริงอย่างน้อยหนึ่งช่วงเวลา
