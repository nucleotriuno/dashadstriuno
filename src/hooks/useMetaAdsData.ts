import { useState, useEffect } from 'react';
import { apiFetch, getDateRange } from '../lib/api';
import type { KPIs, TimeseriesPoint, CampaignRow, AdRow, TimeWindow } from '../types';

interface MetaAdsData {
  kpis: KPIs | null;
  timeseries: TimeseriesPoint[];
  campaigns: CampaignRow[];
  ads: AdRow[];
  loading: boolean;
  error: string | null;
}

export function useMetaAdsData(timeWindow: TimeWindow, accountId: string | null): MetaAdsData {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [ads, setAds] = useState<AdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const { startDate, endDate } = getDateRange(timeWindow);
    const params = { startDate, endDate, accountId };

    Promise.all([
      apiFetch<KPIs>('/api/metrics/kpis', params),
      apiFetch<TimeseriesPoint[]>('/api/metrics/timeseries', params),
      apiFetch<CampaignRow[]>('/api/metrics/campaigns', params),
      apiFetch<AdRow[]>('/api/metrics/ads', params),
    ])
      .then(([k, ts, camp, a]) => {
        if (cancelled) return;
        setKpis(k);
        setTimeseries(ts);
        setCampaigns(camp);
        setAds(a);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [timeWindow, accountId]);

  return { kpis, timeseries, campaigns, ads, loading, error };
}
