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
