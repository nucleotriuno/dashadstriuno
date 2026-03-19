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

  const url = `${BASE}/${env.META_AD_ACCOUNT_ID}/insights?${params}`;
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

export async function fetchAccountInfo(env: Env): Promise<{
  name: string;
  currency: string;
  timezone_name: string;
  account_id: string;
}> {
  const params = new URLSearchParams({
    fields: 'name,currency,timezone_name,account_id',
    access_token: env.META_ACCESS_TOKEN,
  });
  const url = `${BASE}/${env.META_AD_ACCOUNT_ID}?${params}`;
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
  const url = `${BASE}/${env.META_AD_ACCOUNT_ID}/insights?${params}`;
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
