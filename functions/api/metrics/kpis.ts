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
