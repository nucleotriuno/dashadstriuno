import { useState, useEffect } from 'react';
import { apiFetch, getDateRange } from '../lib/api';
import type {
  KPIs,
  TimeseriesPoint,
  CampaignRow,
  AdRow,
  TimeWindow,
} from '../types';

interface MetaAdsData {
  kpis: KPIs | null;
  timeseries: TimeseriesPoint[];
  campaigns: CampaignRow[];
  ads: AdRow[];
  loading: boolean;
  error: string | null;
  accountName: string | null;
}

export function useMetaAdsData(window: TimeWindow): MetaAdsData {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountName, setAccountName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const { startDate, endDate } = getDateRange(window);
    const params = { startDate, endDate };

    Promise.all([
      apiFetch<KPIs>('/api/metrics/kpis', params),
      apiFetch<TimeseriesPoint[]>('/api/metrics/timeseries', params),
      apiFetch<CampaignRow[]>('/api/metrics/campaigns', params),
      apiFetch<AdRow[]>('/api/metrics/ads', params),
      apiFetch<{ account: { name: string } | null }>('/api/metrics/financeiro'),
    ])
      .then(([k, ts, camp, a, fin]) => {
        if (cancelled) return;
        setKpis(k);
        setTimeseries(ts);
        setCampaigns(camp);
        setAds(a);
        setAccountName(fin.account?.name ?? null);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [window]);

  return { kpis, timeseries, campaigns, ads, loading, error, accountName };
}
