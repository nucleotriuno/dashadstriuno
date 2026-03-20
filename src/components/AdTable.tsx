import type { AdRow } from '../types';
import { formatBRL, formatNumber, formatPercent } from '../lib/format';

interface Props {
  data: AdRow[];
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

export function AdTable({ data, loading }: Props) {
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
        Por Anúncio
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>Anúncio</th>
              <th style={{ ...TH, textAlign: 'right' }}>Valor Usado</th>
              <th style={{ ...TH, textAlign: 'right' }}>Alcance</th>
              <th style={{ ...TH, textAlign: 'right' }}>CPM</th>
              <th style={{ ...TH, textAlign: 'right' }}>CTR</th>
              <th style={{ ...TH, textAlign: 'right' }}>Impressões</th>
              <th style={{ ...TH, textAlign: 'right' }}>Leads</th>
              <th style={{ ...TH, textAlign: 'right' }}>CPL</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ ...TD, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Carregando...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ ...TD, textAlign: 'center', color: 'var(--text-muted)' }}>
                  Sem dados
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row.adId}
                  className="fade-up"
                  style={{ animationDelay: `${i * 0.04}s` }}
                >
                  <td style={TD}>{row.adName}</td>
                  <td style={{ ...TD, textAlign: 'right', color: 'var(--amber)' }}>
                    {formatBRL(row.valorUsado)}
                  </td>
                  <td style={{ ...TD, textAlign: 'right' }}>{formatNumber(row.alcance)}</td>
                  <td style={{ ...TD, textAlign: 'right' }}>{formatBRL(row.cpm)}</td>
                  <td style={{ ...TD, textAlign: 'right', color: 'var(--green)' }}>
                    {formatPercent(row.ctr)}
                  </td>
                  <td style={{ ...TD, textAlign: 'right' }}>{formatNumber(row.impressions)}</td>
                  <td style={{ ...TD, textAlign: 'right', color: 'var(--green)' }}>
                    {row.resultados > 0 ? formatNumber(row.resultados) : '—'}
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
