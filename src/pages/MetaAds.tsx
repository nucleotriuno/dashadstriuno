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

export function MetaAds() {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('30dias');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const { selectedAccount } = useAccount();
  const { kpis, timeseries, campaigns, ads, updatedAt, loading, error } =
    useMetaAdsData(timeWindow, selectedAccount?.id ?? null);

  const clientUrl = selectedAccount
    ? `${window.location.origin}/meta-ads?account=${selectedAccount.id}`
    : '';
  const embedCode = `<iframe src="${clientUrl}" width="100%" height="800" frameborder="0" style="border-radius:12px"></iframe>`;

  function handleCopyLink() {
    navigator.clipboard.writeText(clientUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  }

  function handleEmbed() {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
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
                style={{ ...BTN, color: copiedLink ? 'var(--green)' : 'var(--text-dim)', borderColor: copiedLink ? 'var(--green)' : 'var(--border-light)' }}
                onClick={handleCopyLink}
              >
                {copiedLink ? '✓ Copiado!' : '↗ Link do Cliente'}
              </button>
              <button
                style={{ ...BTN, color: copiedEmbed ? 'var(--green)' : 'var(--text-dim)', borderColor: copiedEmbed ? 'var(--green)' : 'var(--border-light)' }}
                onClick={handleEmbed}
              >
                {copiedEmbed ? '✓ Copiado!' : '</> Embed'}
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
