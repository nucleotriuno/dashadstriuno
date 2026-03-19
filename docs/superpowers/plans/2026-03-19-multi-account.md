# Multi-Account Support Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar seletor de conta ao dashboard para que múltiplas contas Meta Ads possam ser visualizadas em um único deploy.

**Architecture:** `META_AD_ACCOUNTS` env var (JSON array) substitui `META_AD_ACCOUNT_ID`. O banco D1 ganha coluna `account_id` nas tabelas que precisam de isolamento por conta. Frontend ganha um `AccountContext` que expõe a conta selecionada para todos os componentes. Todos os endpoints de métricas aceitam `?accountId=` como parâmetro obrigatório.

**Tech Stack:** React 19 + TypeScript, Cloudflare Pages Functions, Cloudflare D1 (SQLite), Meta Marketing API v21.0

---

## File Map

**Create:**
- `functions/api/accounts.ts` — endpoint GET que lê `META_AD_ACCOUNTS` e retorna lista de contas
- `src/context/AccountContext.tsx` — React context com lista de contas e conta selecionada

**Modify:**
- `schema.sql` — adiciona `account_id` em `meta_ad_metrics`, recria `meta_financeiro` com PK composta
- `functions/lib/types.ts` — troca `META_AD_ACCOUNT_ID` por `META_AD_ACCOUNTS`
- `functions/lib/meta-api.ts` — todas as funções recebem `accountId: string` explícito
- `functions/api/sync/trigger.ts` — aceita `?accountId=`, armazena `account_id` no D1
- `functions/api/metrics/kpis.ts` — filtra por `account_id`
- `functions/api/metrics/timeseries.ts` — filtra por `account_id`
- `functions/api/metrics/campaigns.ts` — filtra por `account_id`
- `functions/api/metrics/ads.ts` — filtra por `account_id`
- `functions/api/metrics/financeiro.ts` — filtra por `account_id`
- `src/types/index.ts` — adiciona tipo `Account`
- `src/hooks/useMetaAdsData.ts` — recebe `accountId: string`
- `src/components/Sidebar.tsx` — adiciona dropdown de seleção de conta
- `src/pages/MetaAds.tsx` — lê conta do contexto
- `src/pages/Financeiro.tsx` — lê conta do contexto
- `src/App.tsx` — wraps app com `AccountProvider`

---

## Task 1: Schema D1 com account_id

**Files:**
- Modify: `schema.sql`

O D1 está vazio (backfill não funcionou). Podemos recriar as tabelas do zero com DROP IF EXISTS.

- [ ] **Step 1: Substituir schema.sql**

```sql
-- NOTE: updated_at uses DEFAULT (datetime('now')) for INSERT only.
-- Upsert SQL must explicitly set updated_at = datetime('now') in ON CONFLICT DO UPDATE SET.

-- Meta ad metrics (daily, per ad)
CREATE TABLE IF NOT EXISTS meta_ad_metrics (
  ad_id           TEXT NOT NULL,
  date_ref        TEXT NOT NULL,
  account_id      TEXT NOT NULL DEFAULT '',
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

CREATE INDEX IF NOT EXISTS idx_metrics_account_date
  ON meta_ad_metrics (account_id, date_ref);

-- Account info
CREATE TABLE IF NOT EXISTS meta_account (
  account_id    TEXT PRIMARY KEY,
  name          TEXT,
  currency      TEXT,
  timezone_name TEXT,
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- Monthly financial data (PK composta: account + mês)
CREATE TABLE IF NOT EXISTS meta_financeiro (
  account_id  TEXT NOT NULL,
  month_start TEXT NOT NULL,
  spend       REAL DEFAULT 0,
  tax         REAL DEFAULT 0,
  total       REAL DEFAULT 0,
  updated_at  TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (account_id, month_start)
);
```

- [ ] **Step 2: Recriar tabelas no D1**

No Cloudflare Dashboard → D1 → `meta-dash-db` → Console, rodar:
```sql
DROP TABLE IF EXISTS meta_ad_metrics;
DROP TABLE IF EXISTS meta_account;
DROP TABLE IF EXISTS meta_financeiro;
```
E depois colar e executar o novo `schema.sql` completo.

- [ ] **Step 3: Commit**

```bash
git add schema.sql
git commit -m "feat: add account_id to D1 schema for multi-account support"
```

---

## Task 2: types.ts — trocar env var

**Files:**
- Modify: `functions/lib/types.ts`

- [ ] **Step 1: Atualizar interface Env**

Conteúdo completo do arquivo:
```typescript
export interface Env {
  META_ACCESS_TOKEN: string;
  META_AD_ACCOUNTS: string; // JSON: [{"id":"act_123","name":"Cliente A"},...]
  SYNC_SECRET: string;
  DB: D1Database;
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/lib/types.ts
git commit -m "feat: replace META_AD_ACCOUNT_ID with META_AD_ACCOUNTS in Env"
```

---

## Task 3: meta-api.ts — accountId explícito

**Files:**
- Modify: `functions/lib/meta-api.ts`

Todas as funções que usavam `env.META_AD_ACCOUNT_ID` agora recebem `accountId: string` como parâmetro.

- [ ] **Step 1: Atualizar meta-api.ts**

```typescript
import type { Env } from './types';
import { todaySP } from './date-utils';

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
  accountId: string,
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

  const url = `${BASE}/${accountId}/insights?${params}`;
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

export async function fetchAccountInfo(env: Env, accountId: string): Promise<{
  name: string;
  currency: string;
  timezone_name: string;
  account_id: string;
}> {
  const params = new URLSearchParams({
    fields: 'name,currency,timezone_name,account_id',
    access_token: env.META_ACCESS_TOKEN,
  });
  const url = `${BASE}/${accountId}?${params}`;
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
  accountId: string,
  sinceDate: string
): Promise<MonthlySpendRow[]> {
  const today = todaySP();
  const params = new URLSearchParams({
    level: 'account',
    time_increment: 'monthly',
    fields: 'spend',
    time_range: JSON.stringify({ since: sinceDate, until: today }),
    access_token: env.META_ACCESS_TOKEN,
  });
  const url = `${BASE}/${accountId}/insights?${params}`;
  const rows: MonthlySpendRow[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const res = await fetch(nextUrl);
    if (!res.ok) {
      const err = await res.json() as { error?: { message: string } };
      throw new Error(err.error?.message ?? `Meta API error ${res.status}`);
    }
    const json = await res.json() as {
      data: MonthlySpendRow[];
      paging?: { next?: string };
    };
    rows.push(...json.data);
    nextUrl = json.paging?.next ?? null;
  }

  return rows;
}
```

- [ ] **Step 2: Commit**

```bash
git add functions/lib/meta-api.ts
git commit -m "feat: add explicit accountId param to all meta-api functions"
```

---

## Task 4: /api/accounts endpoint

**Files:**
- Create: `functions/api/accounts.ts`

Endpoint GET que lê `META_AD_ACCOUNTS` (JSON) e retorna a lista. Sem autenticação (igual aos outros endpoints de métricas).

- [ ] **Step 1: Criar functions/api/accounts.ts**

```typescript
import type { Env } from '../lib/types';

interface Account {
  id: string;
  name: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const accounts: Account[] = JSON.parse(env.META_AD_ACCOUNTS ?? '[]');
    return Response.json(accounts);
  } catch {
    return Response.json([], { status: 200 });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/accounts.ts
git commit -m "feat: add GET /api/accounts endpoint"
```

---

## Task 5: sync/trigger.ts — multi-account

**Files:**
- Modify: `functions/api/sync/trigger.ts`

Aceita `?accountId=` (obrigatório). Armazena `account_id` em `meta_ad_metrics` e `meta_financeiro`. Reverte o catch para ocultar detalhes internos.

- [ ] **Step 1: Reescrever trigger.ts**

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
    const accountId = url.searchParams.get('accountId');
    const startDate = url.searchParams.get('startDate') ?? yesterdaySP();
    const endDate = url.searchParams.get('endDate') ?? todaySP();

    if (!accountId) {
      return Response.json({ error: 'accountId is required' }, { status: 400 });
    }

    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
      return Response.json({ error: 'Dates must be in YYYY-MM-DD format' }, { status: 400 });
    }

    // 1. Fetch ad insights from Meta
    const insights = await fetchMetaInsights(env, accountId, startDate, endDate);

    // 2. Upsert ad metrics in batches of 100
    const stmts = insights.map((row) =>
      env.DB.prepare(`
        INSERT INTO meta_ad_metrics (
          ad_id, date_ref, account_id, ad_name, adset_id, adset_name,
          campaign_id, campaign_name, spend, impressions, clicks,
          reach, cpm, ctr, frequency, link_clicks, link_ctr,
          resultados, custo_resultado, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(ad_id, date_ref) DO UPDATE SET
          account_id      = excluded.account_id,
          ad_name         = excluded.ad_name,
          spend           = excluded.spend,
          impressions     = excluded.impressions,
          clicks          = excluded.clicks,
          reach           = excluded.reach,
          cpm             = excluded.cpm,
          ctr             = excluded.ctr,
          frequency       = excluded.frequency,
          link_clicks     = excluded.link_clicks,
          link_ctr        = excluded.link_ctr,
          resultados      = excluded.resultados,
          custo_resultado = excluded.custo_resultado,
          updated_at      = datetime('now')
      `).bind(
        row.ad_id,
        row.date_start,
        accountId,
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

    for (let i = 0; i < stmts.length; i += 100) {
      await env.DB.batch(stmts.slice(i, i + 100));
    }

    // 3. Fetch and upsert account info
    const account = await fetchAccountInfo(env, accountId);
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
    const monthlySpend = await fetchMonthlySpend(env, accountId, '2025-01-01');
    const finStmts = monthlySpend.map((m) => {
      const spend = parseFloat(m.spend ?? '0');
      const applyTax = m.date_start >= TAX_START;
      const total = applyTax ? spend / (1 - TAX_RATE) : spend;
      const tax = total - spend;
      return env.DB.prepare(`
        INSERT INTO meta_financeiro (account_id, month_start, spend, tax, total, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
        ON CONFLICT(account_id, month_start) DO UPDATE SET
          spend      = excluded.spend,
          tax        = excluded.tax,
          total      = excluded.total,
          updated_at = datetime('now')
      `).bind(accountId, m.date_start, spend, tax, total);
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
    console.error(e);
    return Response.json({ error: 'Internal server error', success: false }, { status: 500 });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/sync/trigger.ts
git commit -m "feat: sync trigger accepts accountId, stores account_id in D1"
```

---

## Task 6: Metric endpoints — filtrar por account_id

**Files:**
- Modify: `functions/api/metrics/kpis.ts`
- Modify: `functions/api/metrics/timeseries.ts`
- Modify: `functions/api/metrics/campaigns.ts`
- Modify: `functions/api/metrics/ads.ts`
- Modify: `functions/api/metrics/financeiro.ts`

Todos aceitam `?accountId=` (obrigatório) e adicionam `AND account_id = ?` nas queries.

- [ ] **Step 1: Atualizar kpis.ts**

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
    const accountId = url.searchParams.get('accountId');

    if (!startDate || !endDate || !accountId) {
      return Response.json({ error: 'startDate, endDate and accountId required' }, { status: 400 });
    }

    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
      return Response.json({ error: 'Dates must be in YYYY-MM-DD format' }, { status: 400 });
    }

    const row = await env.DB.prepare(`
      SELECT
        COALESCE(SUM(spend), 0)        AS spend,
        COALESCE(SUM(impressions), 0)  AS impressions,
        COALESCE(SUM(reach), 0)        AS reach,
        COALESCE(SUM(link_clicks), 0)  AS link_clicks
      FROM meta_ad_metrics
      WHERE account_id = ? AND date_ref >= ? AND date_ref <= ?
    `).bind(accountId, startDate, endDate).first<KPIRow>();

    const spend = row?.spend ?? 0;
    const impressions = row?.impressions ?? 0;
    const reach = row?.reach ?? 0;
    const link_clicks = row?.link_clicks ?? 0;

    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const ctr = impressions > 0 ? (link_clicks / impressions) * 100 : 0;
    const frequencia = reach > 0 ? impressions / reach : 0;

    return Response.json({ valorUsado: spend, alcance: reach, ctr, cpm, frequencia });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
```

- [ ] **Step 2: Atualizar timeseries.ts**

```typescript
import type { Env } from '../../lib/types';

interface TSRow { date_ref: string; spend: number; }

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const accountId = url.searchParams.get('accountId');

    if (!startDate || !endDate || !accountId) {
      return Response.json({ error: 'startDate, endDate and accountId required' }, { status: 400 });
    }

    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
      return Response.json({ error: 'Dates must be in YYYY-MM-DD format' }, { status: 400 });
    }

    const result = await env.DB.prepare(`
      SELECT date_ref, COALESCE(SUM(spend), 0) AS spend
      FROM meta_ad_metrics
      WHERE account_id = ? AND date_ref >= ? AND date_ref <= ?
      GROUP BY date_ref
      ORDER BY date_ref ASC
    `).bind(accountId, startDate, endDate).all<TSRow>();

    return Response.json(
      (result.results ?? []).map((r) => ({ date: r.date_ref, valorUsado: r.spend }))
    );
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
```

- [ ] **Step 3: Atualizar campaigns.ts**

```typescript
import type { Env } from '../../lib/types';

interface CampRow {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  reach: number;
  impressions: number;
  link_clicks: number;
  resultados: number;
  custo_resultado: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const accountId = url.searchParams.get('accountId');

    if (!startDate || !endDate || !accountId) {
      return Response.json({ error: 'startDate, endDate and accountId required' }, { status: 400 });
    }

    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
      return Response.json({ error: 'Dates must be in YYYY-MM-DD format' }, { status: 400 });
    }

    const result = await env.DB.prepare(`
      SELECT
        campaign_id,
        campaign_name,
        COALESCE(SUM(spend), 0)           AS spend,
        COALESCE(SUM(reach), 0)           AS reach,
        COALESCE(SUM(impressions), 0)     AS impressions,
        COALESCE(SUM(link_clicks), 0)     AS link_clicks,
        COALESCE(SUM(resultados), 0)      AS resultados,
        COALESCE(AVG(custo_resultado), 0) AS custo_resultado
      FROM meta_ad_metrics
      WHERE account_id = ? AND date_ref >= ? AND date_ref <= ?
      GROUP BY campaign_id, campaign_name
      ORDER BY spend DESC
    `).bind(accountId, startDate, endDate).all<CampRow>();

    return Response.json(
      (result.results ?? []).map((r) => ({
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
    console.error(e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
```

- [ ] **Step 4: Atualizar ads.ts**

```typescript
import type { Env } from '../../lib/types';

interface AdRow {
  ad_id: string;
  ad_name: string;
  spend: number;
  reach: number;
  impressions: number;
  link_clicks: number;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const accountId = url.searchParams.get('accountId');

    if (!startDate || !endDate || !accountId) {
      return Response.json({ error: 'startDate, endDate and accountId required' }, { status: 400 });
    }

    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
      return Response.json({ error: 'Dates must be in YYYY-MM-DD format' }, { status: 400 });
    }

    const result = await env.DB.prepare(`
      SELECT
        ad_id,
        ad_name,
        COALESCE(SUM(spend), 0)       AS spend,
        COALESCE(SUM(reach), 0)       AS reach,
        COALESCE(SUM(impressions), 0) AS impressions,
        COALESCE(SUM(link_clicks), 0) AS link_clicks
      FROM meta_ad_metrics
      WHERE account_id = ? AND date_ref >= ? AND date_ref <= ?
      GROUP BY ad_id, ad_name
      ORDER BY spend DESC
    `).bind(accountId, startDate, endDate).all<AdRow>();

    return Response.json(
      (result.results ?? []).map((r) => ({
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
    console.error(e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
```

- [ ] **Step 5: Atualizar financeiro.ts**

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

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const accountId = url.searchParams.get('accountId');

    if (!accountId) {
      return Response.json({ error: 'accountId required' }, { status: 400 });
    }

    const account = await env.DB.prepare(
      'SELECT account_id, name, currency, timezone_name FROM meta_account WHERE account_id = ?'
    ).bind(accountId).first<AccountRow>();

    const months = await env.DB.prepare(
      'SELECT month_start, spend, tax, total, updated_at FROM meta_financeiro WHERE account_id = ? ORDER BY month_start ASC'
    ).bind(accountId).all<FinRow>();

    const latestUpdated = (months.results ?? []).reduce(
      (latest, r) => (r.updated_at > latest ? r.updated_at : latest),
      ''
    );

    return Response.json({
      account: account
        ? { name: account.name, accountId: account.account_id, currency: account.currency, timezone: account.timezone_name }
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
    console.error(e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
```

- [ ] **Step 6: Commit**

```bash
git add functions/api/metrics/kpis.ts functions/api/metrics/timeseries.ts \
        functions/api/metrics/campaigns.ts functions/api/metrics/ads.ts \
        functions/api/metrics/financeiro.ts
git commit -m "feat: filter all metric endpoints by accountId"
```

---

## Task 7: Frontend — AccountContext e tipos

**Files:**
- Modify: `src/types/index.ts`
- Create: `src/context/AccountContext.tsx`

- [ ] **Step 1: Adicionar tipo Account em src/types/index.ts**

No final do arquivo, adicionar:
```typescript
export interface Account {
  id: string;
  name: string;
}
```

- [ ] **Step 2: Criar src/context/AccountContext.tsx**

```typescript
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Account } from '../types';

interface AccountContextValue {
  accounts: Account[];
  selectedAccount: Account | null;
  setSelectedAccount: (account: Account) => void;
}

const AccountContext = createContext<AccountContextValue>({
  accounts: [],
  selectedAccount: null,
  setSelectedAccount: () => {},
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  useEffect(() => {
    fetch('/api/accounts')
      .then((r) => r.json() as Promise<Account[]>)
      .then((list) => {
        setAccounts(list);
        if (list.length > 0) setSelectedAccount(list[0]);
      })
      .catch(() => {});
  }, []);

  return (
    <AccountContext.Provider value={{ accounts, selectedAccount, setSelectedAccount }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount(): AccountContextValue {
  return useContext(AccountContext);
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts src/context/AccountContext.tsx
git commit -m "feat: add Account type and AccountContext"
```

---

## Task 8: Frontend — Sidebar com seletor de conta

**Files:**
- Modify: `src/components/Sidebar.tsx`

O seletor substitui o nome fixo no topo da sidebar. Quando há apenas uma conta, exibe o nome sem dropdown. Com múltiplas contas, exibe um `<select>` estilizado.

- [ ] **Step 1: Reescrever Sidebar.tsx**

```typescript
import { NavLink } from 'react-router-dom';
import { useAccount } from '../context/AccountContext';

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

export function Sidebar() {
  const { accounts, selectedAccount, setSelectedAccount } = useAccount();

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
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
              flexShrink: 0,
            }}
          >
            B
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            {accounts.length > 1 ? (
              <select
                value={selectedAccount?.id ?? ''}
                onChange={(e) => {
                  const found = accounts.find((a) => a.id === e.target.value);
                  if (found) setSelectedAccount(found);
                }}
                style={{
                  width: '100%',
                  background: 'var(--surface-alt)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 5,
                  color: 'var(--text)',
                  fontFamily: 'var(--sans)',
                  fontSize: 12,
                  fontWeight: 600,
                  padding: '3px 6px',
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            ) : (
              <div
                style={{
                  fontFamily: 'var(--sans)',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectedAccount?.name ?? '...'}
              </div>
            )}
            <div style={{ fontFamily: 'var(--sans)', fontSize: 11, color: 'var(--text-muted)' }}>
              Meta Dashboard
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', margin: '0 -12px', marginBottom: 16 }} />

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

      <div style={{ marginTop: 'auto' }}>
        <div style={{ borderTop: '1px solid var(--border)', margin: '0 -12px 12px' }} />
        <div style={{ fontFamily: 'var(--sans)', fontSize: 10, color: 'var(--text-muted)', padding: '0 4px' }}>
          Meta Marketing API
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Sidebar.tsx
git commit -m "feat: add account selector dropdown to Sidebar"
```

---

## Task 9: Frontend — hooks e pages

**Files:**
- Modify: `src/hooks/useMetaAdsData.ts`
- Modify: `src/pages/MetaAds.tsx`
- Modify: `src/pages/Financeiro.tsx`
- Modify: `src/components/Layout.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Atualizar useMetaAdsData.ts**

```typescript
import { useState, useEffect } from 'react';
import { apiFetch, getDateRange } from '../lib/api';
import type { KPIs, TimeseriesPoint, CampaignRow, AdRow, TimeWindow } from '../types';

interface MetaAdsData {
  kpis: KPIs | null;
  timeseries: TimeseriesPoint[];
  campaigns: CampaignRow[];
  ads: AdRow[];
  loading: boolean;
  error: string | null;
}

export function useMetaAdsData(timeWindow: TimeWindow, accountId: string | null): MetaAdsData {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const { startDate, endDate } = getDateRange(timeWindow);
    const params = { startDate, endDate, accountId };

    Promise.all([
      apiFetch<KPIs>('/api/metrics/kpis', params),
      apiFetch<TimeseriesPoint[]>('/api/metrics/timeseries', params),
      apiFetch<CampaignRow[]>('/api/metrics/campaigns', params),
      apiFetch<AdRow[]>('/api/metrics/ads', params),
    ])
      .then(([k, ts, camp, a]) => {
        if (cancelled) return;
        setKpis(k);
        setTimeseries(ts);
        setCampaigns(camp);
        setAds(a);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [timeWindow, accountId]);

  return { kpis, timeseries, campaigns, ads, loading, error };
}
```

- [ ] **Step 2: Ler o conteúdo atual de MetaAds.tsx e Financeiro.tsx**

Antes de editar, ler os arquivos para saber a estrutura atual:
```bash
# Apenas leitura, não executar como bash — usar Read tool
```
- `src/pages/MetaAds.tsx`
- `src/pages/Financeiro.tsx`
- `src/components/Layout.tsx`

- [ ] **Step 3: Atualizar MetaAds.tsx**

Substituir o uso de `accountName` do hook por `useAccount()`. O hook não retorna mais `accountName`.
Localizar onde `accountName` é passado como prop para `Sidebar` e `KPICards` (ou onde é usado) e substituir por `selectedAccount?.name ?? null`.

Padrão a seguir:
```typescript
import { useAccount } from '../context/AccountContext';
// ...
const { selectedAccount } = useAccount();
const { kpis, timeseries, campaigns, ads, loading, error } = useMetaAdsData(timeWindow, selectedAccount?.id ?? null);
// Onde accountName era usado: selectedAccount?.name ?? null
```

- [ ] **Step 4: Atualizar Financeiro.tsx**

Adicionar `useAccount()` e passar `accountId` para `apiFetch`:
```typescript
import { useAccount } from '../context/AccountContext';
// ...
const { selectedAccount } = useAccount();
// Nas chamadas de fetch: params incluem accountId: selectedAccount?.id ?? ''
```

- [ ] **Step 5: Atualizar Layout.tsx**

`<Sidebar>` não recebe mais `accountName` como prop — remover a prop.

- [ ] **Step 6: Atualizar App.tsx**

Adicionar `AccountProvider` ao redor do router:
```typescript
import { AccountProvider } from './context/AccountContext';
// ...
<AccountProvider>
  <BrowserRouter>
    ...
  </BrowserRouter>
</AccountProvider>
```

- [ ] **Step 7: Verificar build**

```bash
npm run build
```
Expected: sem erros de TypeScript ou build.

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useMetaAdsData.ts src/pages/MetaAds.tsx src/pages/Financeiro.tsx \
        src/components/Layout.tsx src/App.tsx
git commit -m "feat: wire AccountContext to all pages and hooks"
```

---

## Task 10: Push, configurar env var e backfill

**Files:** nenhum arquivo de código

- [ ] **Step 1: Push para produção**

```bash
git push
```
Aguardar deploy verde no Cloudflare Pages.

- [ ] **Step 2: Configurar META_AD_ACCOUNTS no Cloudflare**

Cloudflare Dashboard → Pages → `dashadstriuno` → Settings → Environment variables:
- Remover `META_AD_ACCOUNT_ID`
- Adicionar `META_AD_ACCOUNTS` com valor JSON (exemplo com uma conta):
  ```json
  [{"id":"act_4188587108036765","name":"Triuno"}]
  ```
  Adicionar as demais contas de clientes no mesmo array.

- [ ] **Step 3: Recriar tabelas no D1**

Cloudflare Dashboard → D1 → `meta-dash-db` → Console:
```sql
DROP TABLE IF EXISTS meta_ad_metrics;
DROP TABLE IF EXISTS meta_financeiro;
DROP TABLE IF EXISTS meta_account;
```
Depois colar e executar o novo `schema.sql` completo.

- [ ] **Step 4: Retry deployment**

Após mudar env vars e recriar tabelas, forçar novo deploy:
Cloudflare Pages → `dashadstriuno` → Deployments → **Retry deployment** no último deploy.

- [ ] **Step 5: Backfill mês a mês por conta**

Para cada conta (ex: `act_4188587108036765`), rodar os curls com `&accountId=`:
```bash
URL="https://dashadstriuno.pages.dev/api/sync/trigger"
SECRET="triuno2026$"
ACCOUNT="act_4188587108036765"

curl -X POST "$URL?accountId=$ACCOUNT&startDate=2025-01-01&endDate=2025-01-31" -H "Authorization: Bearer $SECRET"
curl -X POST "$URL?accountId=$ACCOUNT&startDate=2025-02-01&endDate=2025-02-28" -H "Authorization: Bearer $SECRET"
# ... repetir para todos os meses até 2026-03-19
```
