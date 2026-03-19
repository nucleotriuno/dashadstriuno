import { useState } from 'react';
import { TimeWindowPicker } from '../components/TimeWindowPicker';
import { KPICards } from '../components/KPICards';
import { SpendChart } from '../components/SpendChart';
import { CampaignTable } from '../components/CampaignTable';
import { AdTable } from '../components/AdTable';
import { useMetaAdsData } from '../hooks/useMetaAdsData';
import { useAccount } from '../context/AccountContext';
import type { TimeWindow } from '../types';

export function MetaAds() {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('30dias');
  const { selectedAccount } = useAccount();
  const { kpis, timeseries, campaigns, ads, loading, error } =
    useMetaAdsData(timeWindow, selectedAccount?.id ?? null);

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        {selectedAccount && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '4px 12px',
              marginBottom: 12,
            }}
          >
            <span
              className="pulse-dot"
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--green)',
                display: 'inline-block',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--sans)',
                fontSize: 12,
                color: 'var(--text-dim)',
              }}
            >
              {selectedAccount.name}
            </span>
          </div>
        )}
        <h1
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 4px',
          }}
        >
          Meta Ads
        </h1>
        <p
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 14,
            color: 'var(--text-dim)',
            margin: 0,
          }}
        >
          Relatório geral da conta
        </p>
      </div>

      {/* Time window picker */}
      <div style={{ marginBottom: 24 }}>
        <TimeWindowPicker value={timeWindow} onChange={setTimeWindow} />
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: 'var(--red-dim)',
            border: '1px solid var(--red)',
            borderRadius: 8,
            padding: '10px 14px',
            fontFamily: 'var(--mono)',
            fontSize: 13,
            color: 'var(--red)',
            marginBottom: 20,
          }}
        >
          Erro: {error}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ marginBottom: 20 }}>
        <KPICards kpis={kpis} loading={loading} />
      </div>

      {/* Spend Chart */}
      <div style={{ marginBottom: 20 }}>
        <SpendChart data={timeseries} loading={loading} />
      </div>

      {/* Campaign Table */}
      <div style={{ marginBottom: 20 }}>
        <CampaignTable data={campaigns} loading={loading} />
      </div>

      {/* Ad Table */}
      <AdTable data={ads} loading={loading} />
    </div>
  );
}
