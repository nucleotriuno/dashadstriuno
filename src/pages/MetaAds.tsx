import { useState } from 'react';
import { TimeWindowPicker } from '../components/TimeWindowPicker';
import { KPICards } from '../components/KPICards';
import { SpendChart } from '../components/SpendChart';
import { CampaignTable } from '../components/CampaignTable';
import { AdTable } from '../components/AdTable';
import { useMetaAdsData } from '../hooks/useMetaAdsData';
import { useAccount } from '../context/AccountContext';
import type { TimeWindow } from '../types';

const BTN: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  fontFamily: 'var(--mono)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  padding: '6px 12px',
  borderRadius: 7,
  border: '1px solid var(--border-light)',
  background: 'var(--surface-alt)',
  color: 'var(--text-dim)',
  cursor: 'pointer',
  transition: 'color 0.15s, border-color 0.15s',
};

function exportCSV(accountName: string, campaigns: ReturnType<typeof useMetaAdsData>['campaigns'], ads: ReturnType<typeof useMetaAdsData>['ads']) {
  const rows: string[] = [];

  rows.push('=== CAMPANHAS ===');
  rows.push('Campanha,Valor Usado,Alcance,CPM,CTR,Leads,CPL');
  for (const c of campaigns) {
    rows.push([
      `"${c.campaignName}"`,
      c.valorUsado.toFixed(2),
      c.alcance,
      c.cpm.toFixed(2),
      c.ctr.toFixed(2) + '%',
      c.resultados,
      c.custoPorResultado > 0 ? c.custoPorResultado.toFixed(2) : '0',
    ].join(','));
  }

  rows.push('');
  rows.push('=== ANÚNCIOS ===');
  rows.push('Anúncio,Valor Usado,Alcance,CPM,CTR,Impressões,Leads,CPL');
  for (const a of ads) {
    rows.push([
      `"${a.adName}"`,
      a.valorUsado.toFixed(2),
      a.alcance,
      a.cpm.toFixed(2),
      a.ctr.toFixed(2) + '%',
      a.impressions,
      a.resultados,
      a.custoPorResultado > 0 ? a.custoPorResultado.toFixed(2) : '0',
    ].join(','));
  }

  const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meta-ads-${accountName.replace(/\s+/g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function MetaAds() {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('30dias');
  const [copied, setCopied] = useState(false);
  const { selectedAccount } = useAccount();
  const { kpis, timeseries, campaigns, ads, updatedAt, loading, error } =
    useMetaAdsData(timeWindow, selectedAccount?.id ?? null);

  const embedUrl = selectedAccount
    ? `${window.location.origin}/meta-ads?account=${selectedAccount.id}`
    : '';
  const embedCode = `<iframe src="${embedUrl}" width="100%" height="800" frameborder="0" style="border-radius:12px"></iframe>`;

  function handleEmbed() {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // SQLite datetime('now') stores UTC as "YYYY-MM-DD HH:MM:SS" — parse as UTC
  const updatedAtDate = updatedAt ? new Date(updatedAt.replace(' ', 'T') + 'Z') : null;

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
          <div>
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
                <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text-dim)' }}>
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
            <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-dim)', margin: '0 0 4px' }}>
              Relatório geral da conta
            </p>
            {updatedAtDate && (
              <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
                Atualizado em{' '}
                {updatedAtDate.toLocaleString('pt-BR', {
                  timeZone: 'America/Sao_Paulo',
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            )}
          </div>

          {/* Action buttons */}
          {selectedAccount && (
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, paddingTop: 4 }}>
              <button
                style={BTN}
                onClick={() => exportCSV(selectedAccount.name, campaigns, ads)}
                disabled={loading || campaigns.length === 0}
              >
                ↓ Exportar CSV
              </button>
              <button
                style={{ ...BTN, color: copied ? 'var(--green)' : 'var(--text-dim)', borderColor: copied ? 'var(--green)' : 'var(--border-light)' }}
                onClick={handleEmbed}
              >
                {copied ? '✓ Copiado!' : '</> Embed'}
              </button>
            </div>
          )}
        </div>
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
