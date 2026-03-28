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
      (result.results ?? []).map((r) => ({ date: r.date_ref, valorUsado: r.spend })),
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
};
