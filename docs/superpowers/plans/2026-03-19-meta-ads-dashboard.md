# Meta Ads Dashboard Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a full-stack Meta Ads Dashboard on Cloudflare Pages + D1 with a React/TypeScript frontend that displays Meta Marketing API data synced to D1 SQLite.

**Architecture:** Vite SPA (React 19 + TypeScript) served as static files on Cloudflare Pages, consuming a backend of Pages Functions (`/api/*`) that read from a D1 SQLite database. A POST endpoint `/api/sync/trigger` pulls data from Meta Marketing API and upserts into D1. No auth on read endpoints; sync protected by Bearer token.

**Tech Stack:** React 19, TypeScript, Vite 7, Tailwind CSS v4, Recharts, React Router v7, date-fns, Cloudflare Pages Functions, Cloudflare D1 (SQLite), Meta Marketing API v21.0.

---

## Chunk 1: Project Scaffolding & Design System

### Task 1: Initialize Vite project

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `.npmrc`
- Create: `index.html`
- Create: `.gitignore`

- [ ] **Step 1: Scaffold with Vite**

```bash
cd /Users/lucasrinaldi/Triuno
npm create vite@latest . -- --template react-ts --force
```

Expected: Vite scaffold created with `src/` directory.

- [ ] **Step 2: Add .npmrc**

Create `.npmrc` at project root:
```
legacy-peer-deps=true
```

- [ ] **Step 3: Install core dependencies**

```bash
npm install react-router-dom@7 date-fns date-fns-tz recharts react-is --legacy-peer-deps
npm install -D @tailwindcss/vite@latest tailwindcss@4 --legacy-peer-deps
npm install -D @cloudflare/workers-types wrangler --legacy-peer-deps
```

- [ ] **Step 4: Update vite.config.ts**

Replace content of `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})
```

- [ ] **Step 5: Update tsconfig.json**

Replace content of `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 6: Create tsconfig.node.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 7: Update index.html**

Replace content of `index.html`:
```html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Meta Ads Dashboard</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Create .gitignore**

```
node_modules
dist
.env
.dev.vars
.wrangler
```

- [ ] **Step 9: Verify build works**

```bash
cd /Users/lucasrinaldi/Triuno
npm run build
```

Expected: `dist/` created with no errors.

- [ ] **Step 10: Commit**

```bash
git init
git add package.json vite.config.ts tsconfig.json tsconfig.node.json .npmrc index.html .gitignore
git commit -m "chore: scaffold vite react-ts project with tailwind v4"
```

---

### Task 2: Design System (CSS Variables + Fonts)

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Replace src/index.css with design system**

```css
@import "tailwindcss";

:root {
  /* Backgrounds */
  --bg: #0a0a0c;
  --surface: #121216;
  --surface-alt: #18181e;

  /* Borders */
  --border: #1f1f28;
  --border-light: #2a2a36;

  /* Text */
  --text: #e8e8ed;
  --text-dim: #7a7a8c;
  --text-muted: #4a4a58;

  /* Accent colors */
  --accent: #3b82f6;
  --accent-dim: rgba(59, 130, 246, 0.12);
  --green: #22c55e;
  --green-dim: rgba(34, 197, 94, 0.12);
  --amber: #f59e0b;
  --amber-dim: rgba(245, 158, 11, 0.12);
  --red: #ef4444;
  --red-dim: rgba(239, 68, 68, 0.12);
  --purple: #a855f7;
  --purple-dim: rgba(168, 85, 247, 0.12);

  /* Layout */
  --sidebar-w: 220px;

  /* Font tokens */
  --mono: 'JetBrains Mono', monospace;
  --sans: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

body {
  margin: 0;
  font-family: var(--sans);
  background: var(--bg);
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}

/* Noise texture overlay */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.025;
  pointer-events: none;
  z-index: 9999;
}

/* Fade-up animation for cards and rows */
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-up {
  animation: fade-up 0.3s ease forwards;
}

/* Status dot pulse */
@keyframes pulse-dot {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.pulse-dot {
  animation: pulse-dot 2s ease-in-out infinite;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/index.css
git commit -m "feat: add design system css variables, fonts, and animations"
```

---

### Task 3: Types and Shared Utilities

**Files:**
- Create: `src/types/index.ts`
- Create: `src/lib/format.ts`
- Create: `src/lib/api.ts`

- [ ] **Step 1: Create src/types/index.ts**

```typescript
export interface KPIs {
  valorUsado: number;
  alcance: number;
  ctr: number;
  cpm: number;
  frequencia: number;
}

export interface TimeseriesPoint {
  date: string;
  valorUsado: number;
}

export interface CampaignRow {
  campaignId: string;
  campaignName: string;
  valorUsado: number;
  alcance: number;
  cpm: number;
  ctr: number;
  resultados: number;
  custoPorResultado: number;
}

export interface AdRow {
  adId: string;
  adName: string;
  valorUsado: number;
  alcance: number;
  cpm: number;
  ctr: number;
  impressions: number;
}

export interface AccountInfo {
  name: string;
  accountId: string;
  currency: string;
  timezone: string;
}

export interface FinanceiroMonth {
  monthStart: string;
  spend: number;
  tax: number;
  total: number;
}

export interface FinanceiroData {
  account: AccountInfo;
  months: FinanceiroMonth[];
  updatedAt: string;
}

export type TimeWindow =
  | 'hoje'
  | 'ontem'
  | '7dias'
  | '14dias'
  | '30dias'
  | 'este-mes'
  | 'mes-passado';
```

- [ ] **Step 2: Create src/lib/format.ts**

```typescript
export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

export function formatPercent(value: number): string {
  return (
    value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + '%'
  );
}

export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function formatMonthBR(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  });
}
```

- [ ] **Step 3: Create src/lib/api.ts**

```typescript
import { formatInTimeZone } from 'date-fns-tz';
import { subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import type { TimeWindow } from '../types';

const TZ = 'America/Sao_Paulo';

export function getDateRange(window: TimeWindow): { startDate: string; endDate: string } {
  const now = new Date();
  const today = formatInTimeZone(now, TZ, 'yyyy-MM-dd');
  const yesterday = formatInTimeZone(subDays(now, 1), TZ, 'yyyy-MM-dd');

  switch (window) {
    case 'hoje':
      return { startDate: today, endDate: today };
    case 'ontem':
      return { startDate: yesterday, endDate: yesterday };
    case '7dias':
      return {
        startDate: formatInTimeZone(subDays(now, 6), TZ, 'yyyy-MM-dd'),
        endDate: today,
      };
    case '14dias':
      return {
        startDate: formatInTimeZone(subDays(now, 13), TZ, 'yyyy-MM-dd'),
        endDate: today,
      };
    case '30dias':
      return {
        startDate: formatInTimeZone(subDays(now, 29), TZ, 'yyyy-MM-dd'),
        endDate: today,
      };
    case 'este-mes': {
      const start = startOfMonth(now);
      return {
        startDate: formatInTimeZone(start, TZ, 'yyyy-MM-dd'),
        endDate: today,
      };
    }
    case 'mes-passado': {
      const lastMonth = subMonths(now, 1);
      const start = startOfMonth(lastMonth);
      const end = endOfMonth(lastMonth);
      return {
        startDate: formatInTimeZone(start, TZ, 'yyyy-MM-dd'),
        endDate: formatInTimeZone(end, TZ, 'yyyy-MM-dd'),
      };
    }
  }
}

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error || res.statusText);
  }
  return res.json() as Promise<T>;
}

export { apiFetch };
```

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/lib/format.ts src/lib/api.ts
git commit -m "feat: add types, format utils, and api fetch wrapper"
```

---

## Chunk 2: Backend — Cloudflare Pages Functions

### Task 4: Backend Types and D1/Meta Helpers

**Files:**
- Create: `functions/lib/types.ts`
- Create: `functions/lib/d1.ts`
- Create: `functions/lib/date-utils.ts`
- Create: `functions/lib/meta-api.ts`

- [ ] **Step 1: Create functions/lib/types.ts**

```typescript
export interface Env {
  META_ACCESS_TOKEN: string;
  META_AD_ACCOUNT_ID: string;
  SYNC_SECRET: string;
  DB: D1Database;
}
```

- [ ] **Step 2: Create functions/lib/d1.ts**

```typescript
import type { Env } from './types';

export function getDB(env: Env): D1Database {
  return env.DB;
}
```

- [ ] **Step 3: Create functions/lib/date-utils.ts**

```typescript
const TZ = 'America/Sao_Paulo';

function toSP(date: Date): Date {
  // Returns a Date object adjusted to SP timezone offset
  const str = date.toLocaleString('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return new Date(str + 'T00:00:00');
}

export function todaySP(): string {
  return toSP(new Date()).toISOString().slice(0, 10);
}

export function yesterdaySP(): string {
  const d = toSP(new Date());
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
```

- [ ] **Step 4: Create functions/lib/meta-api.ts**

```typescript
import type { Env } from './types';

const BASE = 'https://graph.facebook.com/v21.0';

interface MetaInsightRow {
  ad_id: string;
  ad_name: string;
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
  spend: string;
  impressions: string;
  cpm: string;
  clicks: string;
  ctr: string;
  reach: string;
  frequency: string;
  inline_link_clicks?: string;
  inline_link_click_ctr?: string;
  actions?: Array<{ action_type: string; value: string }>;
  cost_per_action_type?: Array<{ action_type: string; value: string }>;
  date_start: string;
  date_stop: string;
}

export function extractResults(actions?: Array<{ action_type: string; value: string }>): number {
  if (!actions) return 0;
  const priority = ['lead', 'onsite_conversion.lead_grouped', 'omni_purchase'];
  for (const type of priority) {
    const found = actions.find((a) => a.action_type === type);
    if (found) return parseInt(found.value, 10);
  }
  return 0;
}

export function extractCostPerResult(
  costArr?: Array<{ action_type: string; value: string }>
): number {
  if (!costArr) return 0;
  const priority = ['lead', 'onsite_conversion.lead_grouped', 'omni_purchase'];
  for (const type of priority) {
    const found = costArr.find((a) => a.action_type === type);
    if (found) return parseFloat(found.value);
  }
  return 0;
}

export async function fetchMetaInsights(
  env: Env,
  startDate: string,
  endDate: string
): Promise<MetaInsightRow[]> {
  const fields = [
    'ad_id', 'ad_name', 'adset_id', 'adset_name', 'campaign_id', 'campaign_name',
    'spend', 'impressions', 'cpm', 'clicks', 'ctr', 'reach', 'frequency',
    'actions', 'cost_per_action_type', 'inline_link_clicks', 'inline_link_click_ctr',
  ].join(',');

  const params = new URLSearchParams({
    level: 'ad',
    time_increment: '1',
    fields,
    limit: '500',
    time_range: JSON.stringify({ since: startDate, until: endDate }),
    access_token: env.META_ACCESS_TOKEN,
  });

  const url = `${BASE}/${env.META_AD_ACCOUNT_ID}/insights?${params}`;
  const rows: MetaInsightRow[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const res = await fetch(nextUrl);
    if (!res.ok) {
      const err = await res.json() as { error?: { message: string } };
      throw new Error(err.error?.message ?? `Meta API error ${res.status}`);
    }
    const json = await res.json() as {
      data: MetaInsightRow[];
      paging?: { next?: string };
    };
    rows.push(...json.data);
    nextUrl = json.paging?.next ?? null;
  }

  return rows;
}

export async function fetchAccountInfo(env: Env): Promise<{
  name: string;
  currency: string;
  timezone_name: string;
  account_id: string;
}> {
  const params = new URLSearchParams({
    fields: 'name,currency,timezone_name,account_id',
    access_token: env.META_ACCESS_TOKEN,
  });
  const url = `${BASE}/${env.META_AD_ACCOUNT_ID}?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json() as { error?: { message: string } };
    throw new Error(err.error?.message ?? `Meta API error ${res.status}`);
  }
  return res.json() as Promise<{
    name: string;
    currency: string;
    timezone_name: string;
    account_id: string;
  }>;
}

interface MonthlySpendRow {
  spend: string;
  date_start: string;
  date_stop: string;
}

export async function fetchMonthlySpend(
  env: Env,
  sinceDate: string
): Promise<MonthlySpendRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const params = new URLSearchParams({
    level: 'account',
    time_increment: 'monthly',
    fields: 'spend',
    time_range: JSON.stringify({ since: sinceDate, until: today }),
    access_token: env.META_ACCESS_TOKEN,
  });
  const url = `${BASE}/${env.META_AD_ACCOUNT_ID}/insights?${params}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json() as { error?: { message: string } };
    throw new Error(err.error?.message ?? `Meta API error ${res.status}`);
  }
  const json = await res.json() as { data: MonthlySpendRow[] };
  return json.data;
}
```

- [ ] **Step 5: Commit**

```bash
git add functions/
git commit -m "feat: add cloudflare functions lib — types, d1, date-utils, meta-api"
```

---

### Task 5: Database Schema

**Files:**
- Create: `schema.sql`

- [ ] **Step 1: Create schema.sql**

```sql
-- Meta ad metrics (daily, per ad)
CREATE TABLE IF NOT EXISTS meta_ad_metrics (
  ad_id           TEXT NOT NULL,
  date_ref        TEXT NOT NULL,
  ad_name         TEXT,
  adset_id        TEXT,
  adset_name      TEXT,
  campaign_id     TEXT,
  campaign_name   TEXT,
  spend           REAL DEFAULT 0,
  impressions     INTEGER DEFAULT 0,
  clicks          INTEGER DEFAULT 0,
  reach           INTEGER DEFAULT 0,
  cpm             REAL DEFAULT 0,
  ctr             REAL DEFAULT 0,
  frequency       REAL DEFAULT 0,
  link_clicks     INTEGER DEFAULT 0,
  link_ctr        REAL DEFAULT 0,
  resultados      INTEGER DEFAULT 0,
  custo_resultado REAL DEFAULT 0,
  updated_at      TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (ad_id, date_ref)
);

-- Account info
CREATE TABLE IF NOT EXISTS meta_account (
  account_id    TEXT PRIMARY KEY,
  name          TEXT,
  currency      TEXT,
  timezone_name TEXT,
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- Monthly financial data
CREATE TABLE IF NOT EXISTS meta_financeiro (
  month_start TEXT PRIMARY KEY,
  spend       REAL DEFAULT 0,
  tax         REAL DEFAULT 0,
  total       REAL DEFAULT 0,
  updated_at  TEXT DEFAULT (datetime('now'))
);
```

- [ ] **Step 2: Commit**

```bash
git add schema.sql
git commit -m "feat: add d1 schema for meta_ad_metrics, meta_account, meta_financeiro"
```

---

### Task 6: API Endpoints — Read

**Files:**
- Create: `functions/api/metrics/kpis.ts`
- Create: `functions/api/metrics/timeseries.ts`
- Create: `functions/api/metrics/campaigns.ts`
- Create: `functions/api/metrics/ads.ts`
- Create: `functions/api/metrics/financeiro.ts`

- [ ] **Step 1: Create functions/api/metrics/kpis.ts**

```typescript
import type { Env } from '../../lib/types';

interface KPIRow {
  spend: number;
  impressions: number;
  reach: number;
  link_clicks: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!startDate || !endDate) {
      return Response.json({ error: 'startDate and endDate required' }, { status: 400 });
    }

    const row = await env.DB.prepare(`
      SELECT
        COALESCE(SUM(spend), 0)        AS spend,
        COALESCE(SUM(impressions), 0)  AS impressions,
        COALESCE(SUM(reach), 0)        AS reach,
        COALESCE(SUM(link_clicks), 0)  AS link_clicks
      FROM meta_ad_metrics
      WHERE date_ref >= ? AND date_ref <= ?
    `).bind(startDate, endDate).first<KPIRow>();

    const spend = row?.spend ?? 0;
    const impressions = row?.impressions ?? 0;
    const reach = row?.reach ?? 0;
    const link_clicks = row?.link_clicks ?? 0;

    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const ctr = impressions > 0 ? (link_clicks / impressions) * 100 : 0;
    const frequencia = reach > 0 ? impressions / reach : 0;

    return Response.json({
      valorUsado: spend,
      alcance: reach,
      ctr,
      cpm,
      frequencia,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};
```

- [ ] **Step 2: Create functions/api/metrics/timeseries.ts**

```typescript
import type { Env } from '../../lib/types';

interface TSRow {
  date_ref: string;
  spend: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!startDate || !endDate) {
      return Response.json({ error: 'startDate and endDate required' }, { status: 400 });
    }

    const rows = await env.DB.prepare(`
      SELECT date_ref, COALESCE(SUM(spend), 0) AS spend
      FROM meta_ad_metrics
      WHERE date_ref >= ? AND date_ref <= ?
      GROUP BY date_ref
      ORDER BY date_ref ASC
    `).bind(startDate, endDate).all<TSRow>();

    return Response.json(
      (rows.results ?? []).map((r) => ({
        date: r.date_ref,
        valorUsado: r.spend,
      }))
    );
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};
```

- [ ] **Step 3: Create functions/api/metrics/campaigns.ts**

```typescript
import type { Env } from '../../lib/types';

interface CampRow {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  reach: number;
  link_clicks: number;
  resultados: number;
  custo_resultado: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!startDate || !endDate) {
      return Response.json({ error: 'startDate and endDate required' }, { status: 400 });
    }

    const rows = await env.DB.prepare(`
      SELECT
        campaign_id,
        MAX(campaign_name)              AS campaign_name,
        COALESCE(SUM(spend), 0)         AS spend,
        COALESCE(SUM(impressions), 0)   AS impressions,
        COALESCE(SUM(reach), 0)         AS reach,
        COALESCE(SUM(link_clicks), 0)   AS link_clicks,
        COALESCE(SUM(resultados), 0)    AS resultados,
        CASE
          WHEN SUM(resultados) > 0 THEN SUM(spend) / SUM(resultados)
          ELSE 0
        END                             AS custo_resultado
      FROM meta_ad_metrics
      WHERE date_ref >= ? AND date_ref <= ?
      GROUP BY campaign_id
      ORDER BY spend DESC
    `).bind(startDate, endDate).all<CampRow>();

    return Response.json(
      (rows.results ?? []).map((r) => ({
        campaignId: r.campaign_id,
        campaignName: r.campaign_name,
        valorUsado: r.spend,
        alcance: r.reach,
        cpm: r.impressions > 0 ? (r.spend / r.impressions) * 1000 : 0,
        ctr: r.impressions > 0 ? (r.link_clicks / r.impressions) * 100 : 0,
        resultados: r.resultados,
        custoPorResultado: r.custo_resultado,
      }))
    );
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};
```

- [ ] **Step 4: Create functions/api/metrics/ads.ts**

```typescript
import type { Env } from '../../lib/types';

interface AdRow {
  ad_id: string;
  ad_name: string;
  spend: number;
  impressions: number;
  reach: number;
  link_clicks: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    if (!startDate || !endDate) {
      return Response.json({ error: 'startDate and endDate required' }, { status: 400 });
    }

    const rows = await env.DB.prepare(`
      SELECT
        ad_id,
        MAX(ad_name)                    AS ad_name,
        COALESCE(SUM(spend), 0)         AS spend,
        COALESCE(SUM(impressions), 0)   AS impressions,
        COALESCE(SUM(reach), 0)         AS reach,
        COALESCE(SUM(link_clicks), 0)   AS link_clicks
      FROM meta_ad_metrics
      WHERE date_ref >= ? AND date_ref <= ?
      GROUP BY ad_id
      ORDER BY spend DESC
    `).bind(startDate, endDate).all<AdRow>();

    return Response.json(
      (rows.results ?? []).map((r) => ({
        adId: r.ad_id,
        adName: r.ad_name,
        valorUsado: r.spend,
        alcance: r.reach,
        cpm: r.impressions > 0 ? (r.spend / r.impressions) * 1000 : 0,
        ctr: r.impressions > 0 ? (r.link_clicks / r.impressions) * 100 : 0,
        impressions: r.impressions,
      }))
    );
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};
```

- [ ] **Step 5: Create functions/api/metrics/financeiro.ts**

```typescript
import type { Env } from '../../lib/types';

interface AccountRow {
  account_id: string;
  name: string;
  currency: string;
  timezone_name: string;
}

interface FinRow {
  month_start: string;
  spend: number;
  tax: number;
  total: number;
  updated_at: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const account = await env.DB.prepare(
      'SELECT * FROM meta_account LIMIT 1'
    ).first<AccountRow>();

    const months = await env.DB.prepare(
      'SELECT * FROM meta_financeiro ORDER BY month_start ASC'
    ).all<FinRow>();

    const latestUpdated = (months.results ?? []).reduce(
      (latest, r) => (r.updated_at > latest ? r.updated_at : latest),
      ''
    );

    return Response.json({
      account: account
        ? {
            name: account.name,
            accountId: account.account_id,
            currency: account.currency,
            timezone: account.timezone_name,
          }
        : null,
      months: (months.results ?? []).map((r) => ({
        monthStart: r.month_start,
        spend: r.spend,
        tax: r.tax,
        total: r.total,
      })),
      updatedAt: latestUpdated,
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
};
```

- [ ] **Step 6: Commit**

```bash
git add functions/api/metrics/
git commit -m "feat: add api read endpoints — kpis, timeseries, campaigns, ads, financeiro"
```

---

### Task 7: Sync Trigger Endpoint

**Files:**
- Create: `functions/api/sync/trigger.ts`

- [ ] **Step 1: Create functions/api/sync/trigger.ts**

```typescript
import type { Env } from '../../lib/types';
import {
  fetchMetaInsights,
  fetchAccountInfo,
  fetchMonthlySpend,
  extractResults,
  extractCostPerResult,
} from '../../lib/meta-api';
import { todaySP, yesterdaySP } from '../../lib/date-utils';

const TAX_RATE = 0.1215;
const TAX_START = '2026-01-01';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    // Auth check
    const auth = request.headers.get('Authorization') ?? '';
    if (auth !== `Bearer ${env.SYNC_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') ?? yesterdaySP();
    const endDate = url.searchParams.get('endDate') ?? todaySP();

    // 1. Fetch ad insights from Meta
    const insights = await fetchMetaInsights(env, startDate, endDate);

    // 2. Upsert ad metrics in batches of 100
    const stmts = insights.map((row) =>
      env.DB.prepare(`
        INSERT INTO meta_ad_metrics (
          ad_id, date_ref, ad_name, adset_id, adset_name,
          campaign_id, campaign_name, spend, impressions, clicks,
          reach, cpm, ctr, frequency, link_clicks, link_ctr,
          resultados, custo_resultado, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(ad_id, date_ref) DO UPDATE SET
          ad_name        = excluded.ad_name,
          spend          = excluded.spend,
          impressions    = excluded.impressions,
          clicks         = excluded.clicks,
          reach          = excluded.reach,
          cpm            = excluded.cpm,
          ctr            = excluded.ctr,
          frequency      = excluded.frequency,
          link_clicks    = excluded.link_clicks,
          link_ctr       = excluded.link_ctr,
          resultados     = excluded.resultados,
          custo_resultado = excluded.custo_resultado,
          updated_at     = datetime('now')
      `).bind(
        row.ad_id,
        row.date_start,
        row.ad_name,
        row.adset_id,
        row.adset_name,
        row.campaign_id,
        row.campaign_name,
        parseFloat(row.spend ?? '0'),
        parseInt(row.impressions ?? '0', 10),
        parseInt(row.clicks ?? '0', 10),
        parseInt(row.reach ?? '0', 10),
        parseFloat(row.cpm ?? '0'),
        parseFloat(row.ctr ?? '0'),
        parseFloat(row.frequency ?? '0'),
        parseInt(row.inline_link_clicks ?? '0', 10),
        parseFloat(row.inline_link_click_ctr ?? '0'),
        extractResults(row.actions),
        extractCostPerResult(row.cost_per_action_type)
      )
    );

    // Execute in chunks of 100
    for (let i = 0; i < stmts.length; i += 100) {
      await env.DB.batch(stmts.slice(i, i + 100));
    }

    // 3. Fetch and upsert account info
    const account = await fetchAccountInfo(env);
    await env.DB.prepare(`
      INSERT INTO meta_account (account_id, name, currency, timezone_name, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(account_id) DO UPDATE SET
        name          = excluded.name,
        currency      = excluded.currency,
        timezone_name = excluded.timezone_name,
        updated_at    = datetime('now')
    `).bind(account.account_id, account.name, account.currency, account.timezone_name).run();

    // 4. Fetch monthly spend and upsert financeiro
    const monthlySpend = await fetchMonthlySpend(env, '2025-01-01');
    const finStmts = monthlySpend.map((m) => {
      const spend = parseFloat(m.spend ?? '0');
      const applyTax = m.date_start >= TAX_START;
      const total = applyTax ? spend / (1 - TAX_RATE) : spend;
      const tax = total - spend;
      return env.DB.prepare(`
        INSERT INTO meta_financeiro (month_start, spend, tax, total, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'))
        ON CONFLICT(month_start) DO UPDATE SET
          spend      = excluded.spend,
          tax        = excluded.tax,
          total      = excluded.total,
          updated_at = datetime('now')
      `).bind(m.date_start, spend, tax, total);
    });

    if (finStmts.length > 0) {
      await env.DB.batch(finStmts);
    }

    return Response.json({
      success: true,
      synced: insights.length,
      financeiro: monthlySpend.length,
      dateRange: { startDate, endDate },
    });
  } catch (e) {
    return Response.json({ error: String(e), success: false }, { status: 500 });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/sync/trigger.ts
git commit -m "feat: add sync trigger endpoint — meta api to d1 upsert"
```

---

## Chunk 3: Frontend Components

### Task 8: Hook — useMetaAdsData

**Files:**
- Create: `src/hooks/useMetaAdsData.ts`

- [ ] **Step 1: Create src/hooks/useMetaAdsData.ts**

```typescript
import { useState, useEffect } from 'react';
import { apiFetch, getDateRange } from '../lib/api';
import type {
  KPIs,
  TimeseriesPoint,
  CampaignRow,
  AdRow,
  TimeWindow,
} from '../types';

interface MetaAdsData {
  kpis: KPIs | null;
  timeseries: TimeseriesPoint[];
  campaigns: CampaignRow[];
  ads: AdRow[];
  loading: boolean;
  error: string | null;
  accountName: string | null;
}

export function useMetaAdsData(window: TimeWindow): MetaAdsData {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const { startDate, endDate } = getDateRange(window);
    const params = { startDate, endDate };

    Promise.all([
      apiFetch<KPIs>('/api/metrics/kpis', params),
      apiFetch<TimeseriesPoint[]>('/api/metrics/timeseries', params),
      apiFetch<CampaignRow[]>('/api/metrics/campaigns', params),
      apiFetch<AdRow[]>('/api/metrics/ads', params),
      apiFetch<{ account: { name: string } | null }>('/api/metrics/financeiro'),
    ])
      .then(([k, ts, camp, a, fin]) => {
        if (cancelled) return;
        setKpis(k);
        setTimeseries(ts);
        setCampaigns(camp);
        setAds(a);
        setAccountName(fin.account?.name ?? null);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [window]);

  return { kpis, timeseries, campaigns, ads, loading, error, accountName };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useMetaAdsData.ts
git commit -m "feat: add useMetaAdsData hook"
```

---

### Task 9: TimeWindowPicker Component

**Files:**
- Create: `src/components/TimeWindowPicker.tsx`

- [ ] **Step 1: Create src/components/TimeWindowPicker.tsx**

```typescript
import type { TimeWindow } from '../types';

interface Props {
  value: TimeWindow;
  onChange: (w: TimeWindow) => void;
}

const OPTIONS: { label: string; value: TimeWindow }[] = [
  { label: 'Hoje', value: 'hoje' },
  { label: 'Ontem', value: 'ontem' },
  { label: '7 dias', value: '7dias' },
  { label: '14 dias', value: '14dias' },
  { label: '30 dias', value: '30dias' },
  { label: 'Este mês', value: 'este-mes' },
  { label: 'Mês passado', value: 'mes-passado' },
];

export function TimeWindowPicker({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 12,
            padding: '4px 12px',
            borderRadius: 6,
            border: `1px solid ${value === opt.value ? 'var(--border-light)' : 'var(--border)'}`,
            background: value === opt.value ? 'var(--surface-alt)' : 'transparent',
            color: value === opt.value ? 'var(--text)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/TimeWindowPicker.tsx
git commit -m "feat: add TimeWindowPicker component"
```

---

### Task 10: KPICards Component

**Files:**
- Create: `src/components/KPICards.tsx`

- [ ] **Step 1: Create src/components/KPICards.tsx**

```typescript
import type { KPIs } from '../types';
import { formatBRL, formatNumber, formatPercent } from '../lib/format';

interface Props {
  kpis: KPIs | null;
  loading: boolean;
}

interface CardDef {
  label: string;
  value: (k: KPIs) => string;
  color: string;
}

const CARDS: CardDef[] = [
  {
    label: 'Valor Usado',
    value: (k) => formatBRL(k.valorUsado),
    color: 'var(--amber)',
  },
  {
    label: 'Alcance',
    value: (k) => formatNumber(k.alcance),
    color: 'var(--accent)',
  },
  {
    label: 'CTR',
    value: (k) => formatPercent(k.ctr),
    color: 'var(--green)',
  },
  {
    label: 'CPM',
    value: (k) => formatBRL(k.cpm),
    color: 'var(--text-dim)',
  },
  {
    label: 'Frequência',
    value: (k) =>
      k.frequencia.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    color: 'var(--purple)',
  },
];

export function KPICards({ kpis, loading }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 12,
      }}
    >
      {CARDS.map((card, i) => (
        <div
          key={card.label}
          className="fade-up"
          style={{
            animationDelay: `${i * 0.04}s`,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--sans)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            {card.label}
          </div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 22,
              fontWeight: 700,
              color: loading ? 'var(--text-muted)' : card.color,
            }}
          >
            {loading || !kpis ? '—' : card.value(kpis)}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/KPICards.tsx
git commit -m "feat: add KPICards component"
```

---

### Task 11: SpendChart Component

**Files:**
- Create: `src/components/SpendChart.tsx`

- [ ] **Step 1: Create src/components/SpendChart.tsx**

```typescript
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TimeseriesPoint } from '../types';
import { formatBRL, formatDateBR } from '../lib/format';

interface Props {
  data: TimeseriesPoint[];
  loading: boolean;
}

export function SpendChart({ data, loading }: Props) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--sans)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          marginBottom: 12,
        }}
      >
        Gasto Diário
      </div>
      {loading || data.length === 0 ? (
        <div
          style={{
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontFamily: 'var(--mono)',
            fontSize: 13,
          }}
        >
          {loading ? 'Carregando...' : 'Sem dados'}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(v: string) => formatDateBR(v)}
              tick={{ fontSize: 11, fontFamily: 'var(--mono)', fill: 'var(--text-dim)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v: number) => `R$${v.toFixed(0)}`}
              tick={{ fontSize: 11, fontFamily: 'var(--mono)', fill: 'var(--text-dim)' }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface-alt)',
                border: '1px solid var(--border-light)',
                borderRadius: 8,
                fontFamily: 'var(--mono)',
                fontSize: 12,
              }}
              formatter={(value: unknown) => [formatBRL(value as number), 'Gasto']}
              labelFormatter={(label: unknown) => formatDateBR(label as string)}
            />
            <Line
              type="monotone"
              dataKey="valorUsado"
              stroke="var(--amber)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SpendChart.tsx
git commit -m "feat: add SpendChart component with Recharts"
```

---

### Task 12: CampaignTable and AdTable Components

**Files:**
- Create: `src/components/CampaignTable.tsx`
- Create: `src/components/AdTable.tsx`

- [ ] **Step 1: Create src/components/CampaignTable.tsx**

```typescript
import type { CampaignRow } from '../types';
import { formatBRL, formatNumber, formatPercent } from '../lib/format';

interface Props {
  data: CampaignRow[];
  loading: boolean;
}

const TH: React.CSSProperties = {
  fontFamily: 'var(--sans)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  padding: '8px 12px',
  textAlign: 'left',
  borderBottom: '1px solid var(--border)',
};

const TD: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 13,
  color: 'var(--text)',
  padding: '10px 12px',
  borderBottom: '1px solid var(--border)',
};

export function CampaignTable({ data, loading }: Props) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--sans)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          padding: '16px 20px 12px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        Por Campanha
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>Campanha</th>
              <th style={{ ...TH, textAlign: 'right' }}>Valor Usado</th>
              <th style={{ ...TH, textAlign: 'right' }}>Alcance</th>
              <th style={{ ...TH, textAlign: 'right' }}>CPM</th>
              <th style={{ ...TH, textAlign: 'right' }}>CTR</th>
              <th style={{ ...TH, textAlign: 'right' }}>Resultados</th>
              <th style={{ ...TH, textAlign: 'right' }}>Custo/Result.</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ ...TD, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Carregando...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...TD, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Sem dados
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row.campaignId}
                  className="fade-up"
                  style={{
                    animationDelay: `${i * 0.04}s`,
                    background: 'transparent',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      'var(--surface-alt)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                  }}
                >
                  <td style={TD}>{row.campaignName}</td>
                  <td style={{ ...TD, textAlign: 'right', color: 'var(--amber)' }}>
                    {formatBRL(row.valorUsado)}
                  </td>
                  <td style={{ ...TD, textAlign: 'right' }}>{formatNumber(row.alcance)}</td>
                  <td style={{ ...TD, textAlign: 'right' }}>{formatBRL(row.cpm)}</td>
                  <td style={{ ...TD, textAlign: 'right', color: 'var(--green)' }}>
                    {formatPercent(row.ctr)}
                  </td>
                  <td style={{ ...TD, textAlign: 'right', color: 'var(--green)' }}>
                    {formatNumber(row.resultados)}
                  </td>
                  <td style={{ ...TD, textAlign: 'right', color: 'var(--red)' }}>
                    {row.custoPorResultado > 0 ? formatBRL(row.custoPorResultado) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create src/components/AdTable.tsx**

```typescript
import type { AdRow } from '../types';
import { formatBRL, formatNumber, formatPercent } from '../lib/format';

interface Props {
  data: AdRow[];
  loading: boolean;
}

const TH: React.CSSProperties = {
  fontFamily: 'var(--sans)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  padding: '8px 12px',
  textAlign: 'left',
  borderBottom: '1px solid var(--border)',
};

const TD: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 13,
  color: 'var(--text)',
  padding: '10px 12px',
  borderBottom: '1px solid var(--border)',
};

export function AdTable({ data, loading }: Props) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--sans)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          padding: '16px 20px 12px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        Por Anúncio
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>Anúncio</th>
              <th style={{ ...TH, textAlign: 'right' }}>Valor Usado</th>
              <th style={{ ...TH, textAlign: 'right' }}>Alcance</th>
              <th style={{ ...TH, textAlign: 'right' }}>CPM</th>
              <th style={{ ...TH, textAlign: 'right' }}>CTR</th>
              <th style={{ ...TH, textAlign: 'right' }}>Impressões</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ ...TD, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Carregando...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ ...TD, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Sem dados
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row.adId}
                  className="fade-up"
                  style={{ animationDelay: `${i * 0.04}s` }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      'var(--surface-alt)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                  }}
                >
                  <td style={TD}>{row.adName}</td>
                  <td style={{ ...TD, textAlign: 'right', color: 'var(--amber)' }}>
                    {formatBRL(row.valorUsado)}
                  </td>
                  <td style={{ ...TD, textAlign: 'right' }}>{formatNumber(row.alcance)}</td>
                  <td style={{ ...TD, textAlign: 'right' }}>{formatBRL(row.cpm)}</td>
                  <td style={{ ...TD, textAlign: 'right', color: 'var(--green)' }}>
                    {formatPercent(row.ctr)}
                  </td>
                  <td style={{ ...TD, textAlign: 'right' }}>{formatNumber(row.impressions)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/CampaignTable.tsx src/components/AdTable.tsx
git commit -m "feat: add CampaignTable and AdTable components"
```

---

### Task 13: Sidebar and Layout Components

**Files:**
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/Layout.tsx`

- [ ] **Step 1: Create src/components/Sidebar.tsx**

```typescript
import { NavLink } from 'react-router-dom';

interface Props {
  accountName: string | null;
}

const navItemStyle = (isActive: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '7px 12px',
  borderRadius: 7,
  fontFamily: 'var(--sans)',
  fontSize: 13,
  fontWeight: 500,
  color: isActive ? 'var(--text)' : 'var(--text-dim)',
  background: isActive ? 'var(--surface-alt)' : 'transparent',
  textDecoration: 'none',
  transition: 'all 0.15s',
});

export function Sidebar({ accountName }: Props) {
  return (
    <aside
      style={{
        width: 'var(--sidebar-w)',
        minWidth: 'var(--sidebar-w)',
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 12px',
        gap: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
      }}
    >
      {/* Logo / Brand */}
      <div style={{ marginBottom: 20, padding: '0 4px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent)',
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--mono)',
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--accent)',
            }}
          >
            B
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--sans)',
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--text)',
                maxWidth: 150,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {accountName ?? '...'}
            </div>
            <div
              style={{
                fontFamily: 'var(--sans)',
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              Meta Dashboard
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          borderTop: '1px solid var(--border)',
          margin: '0 -12px',
          marginBottom: 16,
        }}
      />

      {/* Nav section */}
      <div
        style={{
          fontFamily: 'var(--sans)',
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          padding: '0 12px',
          marginBottom: 6,
        }}
      >
        Relatórios
      </div>

      <NavLink to="/meta-ads" style={({ isActive }) => navItemStyle(isActive)}>
        <span style={{ fontSize: 14 }}>▶</span>
        Meta Ads
      </NavLink>

      <NavLink to="/financeiro" style={({ isActive }) => navItemStyle(isActive)}>
        <span style={{ fontSize: 14 }}>$</span>
        Financeiro
      </NavLink>

      {/* Bottom footer */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ borderTop: '1px solid var(--border)', margin: '0 -12px 12px' }} />
        <div
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 10,
            color: 'var(--text-muted)',
            padding: '0 4px',
          }}
        >
          Meta Marketing API
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create src/components/Layout.tsx**

```typescript
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export function Layout() {
  const [accountName, setAccountName] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<{ account: { name: string } | null }>('/api/metrics/financeiro')
      .then((data) => setAccountName(data.account?.name ?? null))
      .catch(() => null);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar accountName={accountName} />
      <main style={{ flex: 1, overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar.tsx src/components/Layout.tsx
git commit -m "feat: add Sidebar and Layout components"
```

---

## Chunk 4: Pages, Router, and Final Wiring

### Task 14: MetaAds Page

**Files:**
- Create: `src/pages/MetaAds.tsx`

- [ ] **Step 1: Create src/pages/MetaAds.tsx**

```typescript
import { useState } from 'react';
import { TimeWindowPicker } from '../components/TimeWindowPicker';
import { KPICards } from '../components/KPICards';
import { SpendChart } from '../components/SpendChart';
import { CampaignTable } from '../components/CampaignTable';
import { AdTable } from '../components/AdTable';
import { useMetaAdsData } from '../hooks/useMetaAdsData';
import type { TimeWindow } from '../types';

export function MetaAds() {
  const [window, setWindow] = useState<TimeWindow>('30dias');
  const { kpis, timeseries, campaigns, ads, loading, error, accountName } =
    useMetaAdsData(window);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        {accountName && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '4px 12px',
              marginBottom: 12,
            }}
          >
            <span
              className="pulse-dot"
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--green)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--sans)',
                fontSize: 12,
                color: 'var(--text-dim)',
              }}
            >
              {accountName}
            </span>
          </div>
        )}
        <h1
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 4px',
          }}
        >
          Meta Ads
        </h1>
        <p
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 14,
            color: 'var(--text-dim)',
            margin: 0,
          }}
        >
          Relatório geral da conta
        </p>
      </div>

      {/* Time window picker */}
      <div style={{ marginBottom: 24 }}>
        <TimeWindowPicker value={window} onChange={setWindow} />
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: 'var(--red-dim)',
            border: '1px solid var(--red)',
            borderRadius: 8,
            padding: '10px 14px',
            fontFamily: 'var(--mono)',
            fontSize: 13,
            color: 'var(--red)',
            marginBottom: 20,
          }}
        >
          Erro: {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ marginBottom: 20 }}>
        <KPICards kpis={kpis} loading={loading} />
      </div>

      {/* Spend Chart */}
      <div style={{ marginBottom: 20 }}>
        <SpendChart data={timeseries} loading={loading} />
      </div>

      {/* Campaign Table */}
      <div style={{ marginBottom: 20 }}>
        <CampaignTable data={campaigns} loading={loading} />
      </div>

      {/* Ad Table */}
      <AdTable data={ads} loading={loading} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/MetaAds.tsx
git commit -m "feat: add MetaAds page"
```

---

### Task 15: Financeiro Page

**Files:**
- Create: `src/pages/Financeiro.tsx`

- [ ] **Step 1: Create src/pages/Financeiro.tsx**

```typescript
import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { formatBRL, formatMonthBR, formatDateBR } from '../lib/format';
import type { FinanceiroData } from '../types';

type YearFilter = 'todos' | '2025' | '2026';
type MonthFilter = number | null; // 1-12

export function Financeiro() {
  const [data, setData] = useState<FinanceiroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<YearFilter>('todos');
  const [monthFilter, setMonthFilter] = useState<MonthFilter>(null);

  useEffect(() => {
    setLoading(true);
    apiFetch<FinanceiroData>('/api/metrics/financeiro')
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const months = data?.months ?? [];

  const filtered = months.filter((m) => {
    const year = m.monthStart.slice(0, 4);
    const month = parseInt(m.monthStart.slice(5, 7), 10);
    if (yearFilter !== 'todos' && year !== yearFilter) return false;
    if (monthFilter !== null && month !== monthFilter) return false;
    return true;
  });

  const totalSpend = filtered.reduce((s, m) => s + m.spend, 0);
  const totalTax = filtered.reduce((s, m) => s + m.tax, 0);
  const totalTotal = filtered.reduce((s, m) => s + m.total, 0);

  const maxSpend = Math.max(...filtered.map((m) => m.spend), 1);

  const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        {data?.account && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '4px 12px',
              marginBottom: 12,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--sans)',
                fontSize: 12,
                color: 'var(--text-dim)',
              }}
            >
              {data.account.name}
            </span>
          </div>
        )}
        <h1
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 4px',
          }}
        >
          Financeiro
        </h1>
        <p
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 14,
            color: 'var(--text-dim)',
            margin: 0,
          }}
        >
          Gasto mensal e impostos da conta de anúncios
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        {MONTH_ABBR.map((label, i) => {
          const m = i + 1;
          const isActive = monthFilter === m;
          return (
            <button
              key={m}
              onClick={() => setMonthFilter(isActive ? null : m)}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: 6,
                border: `1px solid ${isActive ? 'var(--border-light)' : 'var(--border)'}`,
                background: isActive ? 'var(--surface-alt)' : 'transparent',
                color: isActive ? 'var(--text)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          );
        })}
        {(['todos', '2025', '2026'] as YearFilter[]).map((y) => (
          <button
            key={y}
            onClick={() => setYearFilter(y)}
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 6,
              border: `1px solid ${yearFilter === y ? 'var(--border-light)' : 'var(--border)'}`,
              background: yearFilter === y ? 'var(--surface-alt)' : 'transparent',
              color: yearFilter === y ? 'var(--text)' : 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            {y === 'todos' ? 'Tudo' : y}
          </button>
        ))}
      </div>

      {error && (
        <div
          style={{
            background: 'var(--red-dim)',
            border: '1px solid var(--red)',
            borderRadius: 8,
            padding: '10px 14px',
            fontFamily: 'var(--mono)',
            fontSize: 13,
            color: 'var(--red)',
            marginBottom: 20,
          }}
        >
          Erro: {error}
        </div>
      )}

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {[
          { label: 'Gasto', value: totalSpend, color: 'var(--accent)', colorDim: 'var(--accent-dim)' },
          { label: 'Impostos', value: totalTax, color: 'var(--amber)', colorDim: 'var(--amber-dim)' },
          { label: 'Total Cobrado', value: totalTotal, color: 'var(--red)', colorDim: 'var(--red-dim)' },
        ].map((card, i) => (
          <div
            key={card.label}
            className="fade-up"
            style={{
              animationDelay: `${i * 0.04}s`,
              background: 'var(--surface)',
              border: `1px solid var(--border)`,
              borderRadius: 12,
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Gradient overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, ${card.colorDim} 0%, transparent 60%)`,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                fontFamily: 'var(--sans)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 8,
                position: 'relative',
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 24,
                fontWeight: 700,
                color: loading ? 'var(--text-muted)' : card.color,
                position: 'relative',
              }}
            >
              {loading ? '—' : formatBRL(card.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Table */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Mês', 'Gasto', 'Impostos', 'Total'].map((h) => (
                <th
                  key={h}
                  style={{
                    fontFamily: 'var(--sans)',
                    fontSize: 11,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    padding: '10px 16px',
                    textAlign: h === 'Mês' ? 'left' : 'right',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  Carregando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  Sem dados
                </td>
              </tr>
            ) : (
              filtered.map((m, i) => (
                <tr
                  key={m.monthStart}
                  className="fade-up"
                  style={{ animationDelay: `${i * 0.04}s` }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      'var(--surface-alt)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                  }}
                >
                  <td
                    style={{
                      fontFamily: 'var(--sans)',
                      fontSize: 13,
                      color: 'var(--text)',
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {formatMonthBR(m.monthStart)}
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 13,
                      color: 'var(--text)',
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'right',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          width: Math.round((m.spend / maxSpend) * 80),
                          height: 4,
                          background: 'var(--accent)',
                          borderRadius: 2,
                          opacity: 0.5,
                        }}
                      />
                      {formatBRL(m.spend)}
                    </div>
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 13,
                      color: m.tax > 0 ? 'var(--amber)' : 'var(--text-muted)',
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'right',
                    }}
                  >
                    {m.tax > 0 ? formatBRL(m.tax) : '—'}
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text)',
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'right',
                    }}
                  >
                    {formatBRL(m.total)}
                  </td>
                </tr>
              ))
            )}
            {/* Totals row */}
            {!loading && filtered.length > 0 && (
              <tr style={{ background: 'var(--surface-alt)' }}>
                <td
                  style={{
                    fontFamily: 'var(--sans)',
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--text-muted)',
                    padding: '10px 16px',
                  }}
                >
                  Total
                </td>
                <td
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--accent)',
                    padding: '10px 16px',
                    textAlign: 'right',
                  }}
                >
                  {formatBRL(totalSpend)}
                </td>
                <td
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--amber)',
                    padding: '10px 16px',
                    textAlign: 'right',
                  }}
                >
                  {totalTax > 0 ? formatBRL(totalTax) : '—'}
                </td>
                <td
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--text)',
                    padding: '10px 16px',
                    textAlign: 'right',
                  }}
                >
                  {formatBRL(totalTotal)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Timestamp */}
        {data?.updatedAt && (
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: 'var(--text-muted)',
              padding: '10px 16px',
              borderTop: '1px solid var(--border)',
              textAlign: 'right',
            }}
          >
            Atualizado em{' '}
            {new Date(data.updatedAt).toLocaleString('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Financeiro.tsx
git commit -m "feat: add Financeiro page with monthly table and summary cards"
```

---

### Task 16: Router, main.tsx, App.tsx

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Replace src/App.tsx**

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { MetaAds } from './pages/MetaAds';
import { Financeiro } from './pages/Financeiro';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/meta-ads" replace />} />
          <Route path="/meta-ads" element={<MetaAds />} />
          <Route path="/financeiro" element={<Financeiro />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

- [ ] **Step 2: Replace src/main.tsx**

```typescript
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

- [ ] **Step 3: Final build check**

```bash
cd /Users/lucasrinaldi/Triuno
npm run build
```

Expected: `dist/` created with 0 TypeScript errors, 0 build errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: wire up router with Layout, MetaAds, and Financeiro pages"
```

---

### Task 17: Wrangler Config for Local Dev

**Files:**
- Create: `wrangler.toml`

- [ ] **Step 1: Create wrangler.toml**

```toml
name = "meta-ads-dashboard"
compatibility_date = "2024-09-23"
pages_build_output_dir = "dist"

[[d1_databases]]
binding = "DB"
database_name = "meta-dash-db"
database_id = "PLACEHOLDER_DATABASE_ID"
```

> Note: Replace `PLACEHOLDER_DATABASE_ID` with the actual D1 database ID from the Cloudflare Dashboard after creating the database.

- [ ] **Step 2: Create .dev.vars (local dev secrets — NOT committed)**

```bash
cat > /Users/lucasrinaldi/Triuno/.dev.vars << 'EOF'
# Copy from .env — these stay local only
META_ACCESS_TOKEN=your_token_here
META_AD_ACCOUNT_ID=act_your_account_id
SYNC_SECRET=your_secret_here
EOF
```

> Note: `.dev.vars` is already in `.gitignore`.

- [ ] **Step 3: Add .dev.vars to .gitignore if not already there**

Ensure `.gitignore` includes `.dev.vars` and `.wrangler`.

- [ ] **Step 4: Commit wrangler.toml only**

```bash
git add wrangler.toml
git commit -m "chore: add wrangler.toml for cloudflare pages local dev"
```

---

### Task 18: Final Verification

- [ ] **Step 1: TypeScript check**

```bash
cd /Users/lucasrinaldi/Triuno
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: Build check**

```bash
npm run build
```

Expected: `dist/` created, no errors, output shows bundled JS/CSS.

- [ ] **Step 3: Final commit tag**

```bash
git add -A
git status
```

Review any remaining uncommitted files, then:
```bash
git commit -m "chore: final cleanup and verification"
```

---

## Deployment Checklist (Manual Steps)

After all code tasks are complete, follow the CLAUDE.md deploy guide:

1. **GitHub**: Push code to a new GitHub repo
2. **Cloudflare D1**: Create `meta-dash-db` database, run `schema.sql` in the console
3. **Cloudflare Pages**: Connect GitHub repo, set build command `npm run build`, output dir `dist`
4. **Bindings**: Add D1 binding `DB` → `meta-dash-db` in Pages Settings → Functions
5. **Env Vars**: Add `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `SYNC_SECRET` in Pages Settings → Environment Variables → Production
6. **Retry deployment** after adding bindings/vars
7. **Backfill data**: Run the curl commands from CLAUDE.md section 5, month by month
8. **Setup cron**: Configure cron-job.org at `0 5,13,21 * * *`

---

## Segurança: Cloudflare Access (configuração manual pós-deploy)

O dashboard não tem autenticação no código — qualquer pessoa com a URL poderia acessar. Para proteger com login (Google ou e-mail OTP), configure o **Cloudflare Zero Trust Access** após o deploy:

### Passo a passo

1. **Cloudflare Dashboard** → **Zero Trust** (menu lateral) → **Access** → **Applications** → **Add an application**

2. Selecionar **Self-hosted**

3. Configurar:
   - **Application name:** `Meta Ads Dashboard`
   - **Session duration:** `24 hours` (ou conforme preferir)
   - **Application domain:** `<seu-projeto>.pages.dev` (ou subdomínio customizado)

4. Em **Policies** → **Add a policy:**
   - **Policy name:** `Owners`
   - **Action:** Allow
   - **Include rule:** `Emails` → adicionar os e-mails autorizados (ex: `seuemail@gmail.com`)
   > Alternativa: usar `Login Methods → Google` para permitir qualquer conta Google sua

5. Salvar. A partir daí, qualquer acesso ao domínio vai exigir autenticação via link mágico no e-mail (ou Google).

### Plano gratuito
- Gratuito para até **50 usuários**
- Nenhuma mudança no código do projeto
- Funciona imediatamente após configurar

### Observação sobre o sync
O endpoint `POST /api/sync/trigger` já é protegido pelo `SYNC_SECRET` (Bearer token). O Cloudflare Access vai bloquear acesso direto pelo browser, mas chamadas curl/cron com o header correto continuam funcionando normalmente pois o Access verifica apenas requisições sem token de serviço válido — ou você pode configurar uma **Service Auth** policy separada para o cron.
