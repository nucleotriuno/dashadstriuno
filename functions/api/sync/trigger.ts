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
    `).bind(accountId, account.name, account.currency, account.timezone_name).run();

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
