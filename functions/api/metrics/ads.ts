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

    const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
    if (!DATE_RE.test(startDate) || !DATE_RE.test(endDate)) {
      return Response.json({ error: 'Dates must be in YYYY-MM-DD format' }, { status: 400 });
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
    console.error(e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
