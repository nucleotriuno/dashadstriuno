import type { CampaignRow } from '../types';
import { formatBRL, formatNumber, formatPercent } from '../lib/format';

interface Props {
  data: CampaignRow[];
  loading: boolean;
}

const TH: React.CSSProperties = {
  fontFamily: 'var(--sans)',
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  padding: '8px 12px',
  textAlign: 'left',
  borderBottom: '1px solid var(--border)',
};

const TD: React.CSSProperties = {
  fontFamily: 'var(--mono)',
  fontSize: 13,
  color: 'var(--text)',
  padding: '10px 12px',
  borderBottom: '1px solid var(--border)',
};

export function CampaignTable({ data, loading }: Props) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--sans)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--text-muted)',
          padding: '16px 20px 12px',
          borderBottom: '1px solid var(--border)',
        }}
      >
        Por Campanha
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>Campanha</th>
              <th style={{ ...TH, textAlign: 'right' }}>Valor Usado</th>
              <th style={{ ...TH, textAlign: 'right' }}>Alcance</th>
              <th style={{ ...TH, textAlign: 'right' }}>CPM</th>
              <th style={{ ...TH, textAlign: 'right' }}>CTR</th>
              <th style={{ ...TH, textAlign: 'right' }}>Resultados</th>
              <th style={{ ...TH, textAlign: 'right' }}>Custo/Result.</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ ...TD, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Carregando...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ ...TD, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Sem dados
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row.campaignId}
                  className="fade-up"
                  style={{
                    animationDelay: `${i * 0.04}s`,
                    background: 'transparent',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background =
                      'var(--surface-alt)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLTableRowElement).style.background = 'transparent';
                  }}
                >
                  <td style={TD}>{row.campaignName}</td>
                  <td style={{ ...TD, textAlign: 'right', color: 'var(--amber)' }}>
                    {formatBRL(row.valorUsado)}
                  </td>
                  <td style={{ ...TD, textAlign: 'right' }}>{formatNumber(row.alcance)}</td>
                  <td style={{ ...TD, textAlign: 'right' }}>{formatBRL(row.cpm)}</td>
                  <td style={{ ...TD, textAlign: 'right', color: 'var(--green)' }}>
                    {formatPercent(row.ctr)}
                  </td>
                  <td style={{ ...TD, textAlign: 'right', color: 'var(--green)' }}>
                    {formatNumber(row.resultados)}
                  </td>
                  <td style={{ ...TD, textAlign: 'right', color: 'var(--red)' }}>
                    {row.custoPorResultado > 0 ? formatBRL(row.custoPorResultado) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
