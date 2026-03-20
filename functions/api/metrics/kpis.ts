import type { Env } from '../../lib/types';

interface KPIRow {
  spend: number;
  impressions: number;
  reach: number;
  link_clicks: number;
  resultados: number;
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
        COALESCE(SUM(link_clicks), 0)  AS link_clicks,
        COALESCE(SUM(resultados), 0)   AS resultados
      FROM meta_ad_metrics
      WHERE account_id = ? AND date_ref >= ? AND date_ref <= ?
    `).bind(accountId, startDate, endDate).first<KPIRow>();

    const spend = row?.spend ?? 0;
    const impressions = row?.impressions ?? 0;
    const reach = row?.reach ?? 0;
    const link_clicks = row?.link_clicks ?? 0;
    const resultados = row?.resultados ?? 0;

    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const ctr = impressions > 0 ? (link_clicks / impressions) * 100 : 0;
    const frequencia = reach > 0 ? impressions / reach : 0;
    const cpl = resultados > 0 ? spend / resultados : 0;

    return Response.json({ valorUsado: spend, alcance: reach, ctr, cpm, frequencia, leads: resultados, cpl });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
