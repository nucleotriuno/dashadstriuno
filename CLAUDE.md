# CLAUDE.md — Meta Ads Dashboard (Cloudflare Pages + D1)

## O que é este projeto

Dashboard de relatórios Meta Ads construído com React + TypeScript + Vite, hospedado 100% no Cloudflare (Pages + D1 + Functions). Sem login, sem banco externo, sem servidor próprio. Os dados vêm da Meta Marketing API, são armazenados no D1 (SQLite na edge) e consumidos pelo frontend via endpoints `/api/*`.

---

## Stack

```
Frontend:  React 19 + TypeScript + Vite 7
Styling:   Tailwind CSS v4 + CSS custom properties
Charts:    Recharts (requer dep react-is)
Routing:   React Router v7
Datas:     date-fns + date-fns-tz
Backend:   Cloudflare Pages Functions (file-based routing)
Database:  Cloudflare D1 (SQLite)
API:       Meta Marketing API v21.0
```

### Observações de compatibilidade

- **Vite 7 (não 8):** O `@tailwindcss/vite` suporta apenas Vite `^5.2 || ^6 || ^7`. Não fazer upgrade para Vite 8 até que o Tailwind suporte.
- **react-is:** O Recharts depende de `react-is` mas não o lista como dep. Deve estar no `package.json` explicitamente.
- **.npmrc:** Contém `legacy-peer-deps=true` para resolver conflitos de peer deps no build do Cloudflare Pages.

---

## Estrutura do Projeto

```
/
├── index.html
├── package.json
├── vite.config.ts
├── .npmrc                         # legacy-peer-deps=true (necessário para build Cloudflare)
├── schema.sql                     # Schema D1 para referência
│
├── src/                           # Frontend (React SPA)
│   ├── main.tsx
│   ├── App.tsx                    # Router — sem auth
│   ├── index.css                  # Design system (CSS variables + Tailwind + animações)
│   ├── pages/
│   │   ├── MetaAds.tsx            # Página de relatório Meta Ads
│   │   └── Financeiro.tsx         # Gasto mensal + impostos
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── Layout.tsx             # Sidebar + <Outlet />
│   │   ├── KPICards.tsx           # Valor Usado, Alcance, CTR, CPM, Frequência
│   │   ├── SpendChart.tsx         # Gráfico diário (linha única)
│   │   ├── CampaignTable.tsx      # Tabela por campanha
│   │   ├── AdTable.tsx            # Tabela por anúncio
│   │   └── TimeWindowPicker.tsx   # Seletor de período
│   ├── hooks/
│   │   └── useMetaAdsData.ts
│   ├── lib/
│   │   ├── api.ts                 # fetch() wrapper para /api/*
│   │   └── format.ts              # Formatadores BRL, %, datas
│   └── types/
│       └── index.ts
│
└── functions/                     # Backend (Cloudflare Pages Functions)
    ├── api/
    │   ├── metrics/
    │   │   ├── kpis.ts            # GET — KPIs agregados
    │   │   ├── timeseries.ts      # GET — série diária de gasto
    │   │   ├── campaigns.ts       # GET — tabela de campanhas
    │   │   ├── ads.ts             # GET — tabela de anúncios
    │   │   └── financeiro.ts      # GET — gasto mensal + imposto
    │   └── sync/
    │       └── trigger.ts         # POST — busca Meta → upsert D1 (com try/catch)
    └── lib/
        ├── d1.ts                  # Helper D1
        ├── meta-api.ts            # Chamadas Meta Marketing API
        ├── date-utils.ts          # Helpers timezone São Paulo
        └── types.ts               # Interface Env
```

---

## Deploy — Passo a Passo Completo

### 1. Criar repositório GitHub

- Criar repo no GitHub **sem** template de `.gitignore` (o projeto já tem o seu próprio)
- Push do código para o repo

### 2. Criar banco D1 no Cloudflare

1. Cloudflare Dashboard → **Workers & Pages** → **D1 SQL Database** → **Create** → nome: `meta-dash-db`
2. Na aba **Console** do D1, colar e executar todo o conteúdo de `schema.sql`

### 3. Criar projeto Pages no Cloudflare

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → Conectar ao repo GitHub
2. Configurações de build:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory (Caminho):** deixar vazio (raiz)

### 4. Configurar bindings e variáveis (ANTES do primeiro deploy funcionar)

No Cloudflare Dashboard → seu projeto Pages → **Settings**:

#### D1 Database Binding
- Settings → **Functions** → **D1 database bindings**
- Variable name: `DB`
- Database: selecionar `meta-dash-db`

#### Environment Variables
- Settings → **Environment variables** → **Production** (e Preview se desejar)

| Variável | O que é | Exemplo |
|----------|---------|---------|
| `META_ACCESS_TOKEN` | Token Meta long-lived | `EAABs...` |
| `META_AD_ACCOUNT_ID` | ID da conta (com prefixo `act_`) | `act_123456789` |
| `SYNC_SECRET` | Bearer token para proteger o endpoint sync | Qualquer string |

> Após adicionar bindings/variáveis, faça **Retry deployment** para que o build pegue as configurações.

### 5. Backfill inicial de dados

A Meta API retorna erro 500 (subcode 99) se o período for muito grande. **Fazer backfill mês a mês:**

```bash
# Ajustar SEU_DOMINIO e SEU_SECRET
URL="https://SEU_DOMINIO.pages.dev/api/sync/trigger"
SECRET="SEU_SECRET"

curl -X POST "$URL?startDate=2025-01-01&endDate=2025-01-31" -H "Authorization: Bearer $SECRET"
curl -X POST "$URL?startDate=2025-02-01&endDate=2025-02-28" -H "Authorization: Bearer $SECRET"
curl -X POST "$URL?startDate=2025-03-01&endDate=2025-03-31" -H "Authorization: Bearer $SECRET"
curl -X POST "$URL?startDate=2025-04-01&endDate=2025-04-30" -H "Authorization: Bearer $SECRET"
curl -X POST "$URL?startDate=2025-05-01&endDate=2025-05-31" -H "Authorization: Bearer $SECRET"
curl -X POST "$URL?startDate=2025-06-01&endDate=2025-06-30" -H "Authorization: Bearer $SECRET"
curl -X POST "$URL?startDate=2025-07-01&endDate=2025-07-31" -H "Authorization: Bearer $SECRET"
curl -X POST "$URL?startDate=2025-08-01&endDate=2025-08-31" -H "Authorization: Bearer $SECRET"
curl -X POST "$URL?startDate=2025-09-01&endDate=2025-09-30" -H "Authorization: Bearer $SECRET"
curl -X POST "$URL?startDate=2025-10-01&endDate=2025-10-31" -H "Authorization: Bearer $SECRET"
curl -X POST "$URL?startDate=2025-11-01&endDate=2025-11-30" -H "Authorization: Bearer $SECRET"
curl -X POST "$URL?startDate=2025-12-01&endDate=2025-12-31" -H "Authorization: Bearer $SECRET"
curl -X POST "$URL?startDate=2026-01-01&endDate=2026-01-31" -H "Authorization: Bearer $SECRET"
curl -X POST "$URL?startDate=2026-02-01&endDate=2026-02-28" -H "Authorization: Bearer $SECRET"
curl -X POST "$URL?startDate=2026-03-01&endDate=2026-03-17" -H "Authorization: Bearer $SECRET"
```

Cada chamada retorna `{ "success": true, "synced": N, ... }` se OK.

### 6. Configurar cron automático

Usar [cron-job.org](https://cron-job.org) (gratuito):

- **URL:** `POST https://SEU_DOMINIO.pages.dev/api/sync/trigger`
- **Header:** `Authorization: Bearer SEU_SECRET`
- **Schedule:** `0 5,13,21 * * *` (3x ao dia: 5h, 13h, 21h)

O sync sem query params puxa automaticamente ontem + hoje (timezone São Paulo).

---

## Troubleshooting

### Erro 1101 no Cloudflare
- O Worker crashou. Verificar se o binding D1 (`DB`) está configurado e se o schema foi executado.
- Após adicionar bindings, é necessário fazer **Retry deployment** ou novo push.

### Erro `{"error":"Unauthorized"}`
- O `SYNC_SECRET` no Cloudflare não bate com o Bearer do curl. Verificar espaços/aspas extras.

### Erro Meta API 500 (subcode 99)
- Período muito grande. Dividir em intervalos menores (máximo 1 mês por chamada).

### Build falha com ERESOLVE peer deps
- O `.npmrc` com `legacy-peer-deps=true` resolve. Se removido, o build do Cloudflare vai falhar.

### Build falha com "cannot resolve react-is"
- O `react-is` precisa estar no `package.json`. Instalar com `npm install react-is --legacy-peer-deps`.

---

## Variáveis de Ambiente (Cloudflare Dashboard)

ZERO segredos no código. Tudo fica no Cloudflare Dashboard → Pages → Settings → Environment variables.

| Variável | O que é | Exemplo |
|----------|---------|---------|
| `META_ACCESS_TOKEN` | Token Meta (long-lived) | `EAABs...` |
| `META_AD_ACCOUNT_ID` | ID da conta de anúncio (com prefixo `act_`) | `act_123456789` |
| `SYNC_SECRET` | Bearer token pro cron chamar /api/sync | String aleatória |

O D1 é vinculado como binding (variável `DB`) — sem credencial.

### Interface Env (functions/lib/types.ts)

```typescript
export interface Env {
  META_ACCESS_TOKEN: string;
  META_AD_ACCOUNT_ID: string;
  SYNC_SECRET: string;
  DB: D1Database;
}
```

### REGRA ABSOLUTA DE SEGURANÇA

- NUNCA colocar segredos em arquivos de código ou config
- NUNCA expor `META_ACCESS_TOKEN` no frontend — toda chamada à Meta API é server-side
- NUNCA commitar `.env` ou `.dev.vars`

---

## Design System

### Fontes

No `<head>` do `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300..700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

- **DM Sans** → todo texto de UI (body, labels, headings, nav)
- **JetBrains Mono** → todos os valores de dados (números, moeda, datas, %, botões de filtro)

### CSS Variables (src/index.css)

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
```

### Cores por Métrica

| Métrica | Token |
|---------|-------|
| Valor Usado (spend) | `--amber` |
| Alcance (reach) | `--accent` |
| CTR | `--green` |
| CPM | `--text-dim` |
| Frequência | `--purple` |
| Resultados | `--green` |
| Custo por Resultado | `--red` |

### Padrões de Componentes

- **KPI Card:** bg `var(--surface)`, border `var(--border)`, rounded-xl, label uppercase text-xs `--text-muted`, value text-2xl font-bold font-mono
- **Tabela:** bg `var(--surface)`, header text-xs uppercase `--text-muted`, hover `var(--surface-alt)`, células numéricas font-mono text-right
- **Botões de filtro:** font-mono 12px, ativo: bg `var(--surface-alt)` border `var(--border-light)`, inativo: transparente `--text-muted`
- **Charts (Recharts):** bg `var(--surface)`, grid strokeDasharray="3 3", axis fontSize 12 fontFamily mono, strokeWidth 2 dot false type monotone
- **Recharts Tooltip:** usar `formatter={(value: any) => ...}` e `labelFormatter={(label: any) => ...}` para evitar erros de tipo TS

### Animações

Usar classe `fade-up` para entrada escalonada de cards e linhas (translateY 12px → 0, opacity 0 → 1, delay incrementando 0.04s por item). Status dot com animação pulse 2s.

### Noise Texture

Overlay fractal noise em body::after com opacity 0.025, position fixed, pointer-events none, z-index 9999.

### Formatação pt-BR

```typescript
// lib/format.ts
export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL', minimumFractionDigits: 2,
  });
}

export function formatPercent(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }) + '%';
}

export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
```

Todas as datas usam timezone `America/Sao_Paulo`.

---

## Banco de Dados (Cloudflare D1)

### Criar no Cloudflare

1. Dashboard → Workers & Pages → D1 SQL Database → Create → nome: `meta-dash-db`
2. Bind no projeto Pages: Settings → Functions → D1 bindings → variável `DB` → selecionar `meta-dash-db`
3. No Console do D1, executar o conteúdo de `schema.sql`

### schema.sql

Arquivo na raiz do projeto com todo o schema. Executar no console do D1.

### Padrões D1

- D1 é SQLite: usar `TEXT` em vez de `TIMESTAMPTZ`, `REAL` em vez de `DECIMAL`, `datetime('now')` em vez de `NOW()`
- Sem `BIGSERIAL` — usar chave composta `(ad_id, date_ref)`
- Prepared statements com `.bind()` e `.all()` ou `.run()`
- Para inserts em massa usar `db.batch(stmts)` — limite de 100 statements por batch
- Upsert com `ON CONFLICT ... DO UPDATE SET`

---

## Backend: Meta API Sync

### Meta Marketing API (functions/lib/meta-api.ts)

Três funções, todas recebem `env: Env`:

#### 1. fetchMetaInsights — Métricas diárias por anúncio

```
GET https://graph.facebook.com/v21.0/{AD_ACCOUNT_ID}/insights
  level: ad
  time_increment: 1
  fields: ad_id, ad_name, adset_id, adset_name, campaign_id, campaign_name,
          spend, impressions, cpm, clicks, ctr, reach, frequency,
          actions, cost_per_action_type, inline_link_clicks, inline_link_click_ctr
  limit: 500
```

Paginar seguindo `json.paging.next` até null.

#### 2. fetchAccountInfo — Nome, moeda, timezone da conta

```
GET https://graph.facebook.com/v21.0/{AD_ACCOUNT_ID}
  fields: name, currency, timezone_name, account_id
```

#### 3. fetchMonthlySpend — Totais mensais (para Financeiro)

```
GET https://graph.facebook.com/v21.0/{AD_ACCOUNT_ID}/insights
  level: account
  time_increment: monthly
  fields: spend
  time_range: { since: "2025-01-01", until: hoje }
```

### Extração de Resultados (actions)

A Meta retorna `actions` como array de objetos. Para extrair "resultados":

```typescript
// Prioridade: lead > onsite_conversion.lead_grouped > omni_purchase
function extractResults(actions: any[]): number {
  if (!actions) return 0;
  const priority = ['lead', 'onsite_conversion.lead_grouped', 'omni_purchase'];
  for (const type of priority) {
    const found = actions.find((a: any) => a.action_type === type);
    if (found) return parseInt(found.value, 10);
  }
  return 0;
}
```

Mesma lógica para `extractCostPerResult` usando `cost_per_action_type`.

### Sync Trigger (functions/api/sync/trigger.ts)

Endpoint `POST` protegido com try/catch que retorna erros como JSON (evita erro 1101 opaco):
1. Valida `Authorization: Bearer {SYNC_SECRET}`
2. Busca `startDate`/`endDate` dos query params (ou default: ontem + hoje em SP)
3. Fetch insights da Meta → upsert em `meta_ad_metrics` via `db.batch()` (chunks de 100)
4. Fetch account info → upsert em `meta_account`
5. Fetch monthly spend → calcula imposto → upsert em `meta_financeiro`
6. Retorna `{ success, synced, financeiro, dateRange }`

---

## Cron

Usar cron-job.org (ou similar) — Cloudflare Pages Functions não tem cron nativo.

- URL: `POST https://SEU_DOMINIO.pages.dev/api/sync/trigger`
- Header: `Authorization: Bearer SEU_SECRET`
- Schedule: `0 5,13,21 * * *` (3x ao dia: 5h, 13h, 21h)
- Sem query params = sincroniza ontem + hoje automaticamente

---

## Endpoints da API (Backend → Frontend)

Todos recebem `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD` como query params. Sem autenticação.

### GET /api/metrics/kpis

Retorna KPIs agregados:
```json
{ "valorUsado": 1234.56, "alcance": 45678, "ctr": 1.73, "cpm": 12.50, "frequencia": 1.45 }
```
Calcula: CPM = (spend/impressions)*1000, CTR = (link_clicks/impressions)*100, Frequência = impressions/reach

### GET /api/metrics/timeseries

Retorna série diária: `[{ "date": "2026-03-15", "valorUsado": 123.45 }, ...]`

### GET /api/metrics/campaigns

Retorna tabela por campanha: `[{ campaignId, campaignName, valorUsado, alcance, cpm, ctr, resultados, custoPorResultado }, ...]`
Ordenado por spend DESC.

### GET /api/metrics/ads

Retorna tabela por anúncio: `[{ adId, adName, valorUsado, alcance, cpm, ctr, impressions }, ...]`
Ordenado por spend DESC.

### GET /api/metrics/financeiro

Retorna conta + meses: `{ account: { name, accountId, currency, timezone }, months: [{ monthStart, spend, tax, total }], updatedAt }`

---

## Regra de Imposto (Financeiro)

**12,15% de imposto (ISS/PIS) a partir de janeiro de 2026.** Antes disso, imposto = 0.

```typescript
const TAX_RATE = 0.1215;
const TAX_START = '2026-01-01';

// Imposto é calculado sobre o total, não adicionado em cima:
// total = spend / (1 - 0.1215)
// tax = total - spend
```

---

## Páginas do Frontend

### 1. Meta Ads (/meta-ads)

Layout:
- Badge com nome da conta + dot pulsante
- Título "Meta Ads" + subtítulo "Relatório geral da conta"
- TimeWindowPicker: `Hoje | Ontem | 7 dias | 14 dias | 30 dias | Este mês | Mês passado`
- 5 KPI Cards: Valor Usado, Alcance, CTR, CPM, Frequência
- Gráfico diário de gasto (linha única, ~200px altura, cor amber)
- Tabela de campanhas: Campanha, Valor Usado, Alcance, CPM, CTR, Resultados, Custo/Resultado
- Tabela de anúncios: Anúncio, Valor Usado, Alcance, CPM, CTR, Impressões

### 2. Financeiro (/financeiro)

Layout:
- Badge com nome da conta
- Título "Financeiro" + período
- Filtro por mês/ano: `Jan | Fev | Mar | ... | 2025 | 2026 | Tudo`
- 3 Summary Cards com gradient overlay: Gasto (blue), Impostos (amber), Total Cobrado (red)
- Tabela mensal: Mês, Gasto (com barra visual relativa), Impostos, Total
- Linha de total na tabela
- Timestamp "Atualizado em DD/MM/YYYY HH:MM"

### Sidebar

Duas abas fixas:
```
[B] Account Name
    Meta Dashboard
─────────────────
RELATÓRIOS
  ▶ Meta Ads
  $ Financeiro
─────────────────
Meta Marketing API
```

### Router (src/App.tsx)

Sem login, sem auth guard:
```tsx
<BrowserRouter>
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<Navigate to="/meta-ads" />} />
      <Route path="/meta-ads" element={<MetaAds />} />
      <Route path="/financeiro" element={<Financeiro />} />
    </Route>
  </Routes>
</BrowserRouter>
```

---

## Fluxo de Dados Completo

```
cron-job.org (3x ao dia: 5h, 13h, 21h)
    │
    POST /api/sync/trigger + Bearer SYNC_SECRET
    │
    ▼
Cloudflare Pages Functions
    │
    ├── env.META_ACCESS_TOKEN ──► Meta Marketing API (fetch)
    ├── env.DB (D1 binding) ──► D1 SQLite (write/upsert)
    │
    /api/metrics/* ◄── Frontend React (read, sem auth)
    │
    ▼
React SPA (Cloudflare Pages static)
    fetch('/api/metrics/kpis?startDate=...&endDate=...')
    Renderiza: KPIs, gráfico, tabelas, Financeiro
```

**Nenhum segredo toca o frontend.** O SPA só chama `/api/*`. Toda comunicação com a Meta API é server-side.

---

## Regras para o Claude Code

- Sempre usar TypeScript — nunca JS puro
- Todos os valores monetários em BRL, formatados com `pt-BR` locale
- Todas as datas em `America/Sao_Paulo` timezone
- Font mono (JetBrains Mono) para TODOS os valores numéricos
- Font sans (DM Sans) para TODOS os textos de interface
- Seguir o design system dark mode — nunca usar cores claras
- Componentizar tudo — cada card, tabela, chart é seu próprio componente
- Backend: Cloudflare Pages Functions com `PagesFunction<Env>` tipado
- Banco: queries D1 com prepared statements e `.bind()`
- NUNCA expor tokens no frontend
- Upsert com `ON CONFLICT DO UPDATE` para idempotência
- Paginar chamadas à Meta API seguindo `paging.next`
- Manter Vite na v7 até Tailwind suportar v8
- Manter `.npmrc` com `legacy-peer-deps=true`
- Sync trigger deve ter try/catch com retorno do erro em JSON
- Backfill da Meta API deve ser feito mês a mês (períodos longos causam erro 500)
