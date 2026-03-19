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
