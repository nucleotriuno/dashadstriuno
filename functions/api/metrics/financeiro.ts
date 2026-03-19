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
