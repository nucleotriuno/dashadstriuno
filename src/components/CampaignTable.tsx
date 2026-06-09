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

/** Infer objective from name when API column not yet populated */
function inferObjetivoFromName(name: string): string {
  const n = name.toUpperCase();
  if (n.includes('ENGAJAMENTO') || n.includes('ENGAGEMENT')) return 'OUTCOME_ENGAGEMENT';
  if (n.includes('TRAFEGO') || n.includes('TRÁFEGO') || n.includes('TRAFFIC')) return 'OUTCOME_TRAFFIC';
  if (n.includes('VENDA') || n.includes('SALE') || n.includes('COMPRA')) return 'OUTCOME_SALES';
  if (n.includes('AWARENESS') || n.includes('ALCANCE')) return 'OUTCOME_AWARENESS';
  return '';
}

function resolveObjetivo(row: CampaignRow): string {
  return row.objetivo || inferObjetivoFromName(row.campaignName);
}

interface RowMetrics {
  resultado: number;
  resultadoLabel: string;
  cpr: number;
  cprLabel: string;
}

function getRowMetrics(row: CampaignRow): RowMetrics {
  const obj = resolveObjetivo(row);
  switch (obj) {
    case 'OUTCOME_ENGAGEMENT':
    case 'OUTCOME_TRAFFIC':
    case 'OUTCOME_APP_PROMOTION':
      return {
        resultado: row.linkCliques ?? 0,
        resultadoLabel: 'Cliques',
        cpr: row.cpc ?? 0,
        cprLabel: 'CPC',
      };
    case 'OUTCOME_SALES':
      return {
        resultado: row.resultados,
        resultadoLabel: 'Vendas',
        cpr: row.custoPorResultado,
        cprLabel: 'CPV',
      };
    case 'OUTCOME_AWARENESS':
      return {
        resultado: row.alcance,
        resultadoLabel: 'Alcance',
        cpr: row.cpm,
        cprLabel: 'CPM',
      };
    default:
      return {
        resultado: row.resultados,
        resultadoLabel: 'Leads',
        cpr: row.custoPorResultado,
        cprLabel: 'CPL',
      };
  }
}

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
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={TH}>Campanha</th>
              <th style={{ ...TH, textAlign: 'right' }}>Valor Usado</th>
              <th style={{ ...TH, textAlign: 'right' }}>Alcance</th>
              <th style={{ ...TH, textAlign: 'right' }}>CPM</th>
              <th style={{ ...TH, textAlign: 'right' }}>CTR</th>
              <th style={{ ...TH, textAlign: 'right' }}>Resultado</th>
              <th style={{ ...TH, textAlign: 'right' }}>CPR</th>
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
              data.map((row, i) => {
                const m = getRowMetrics(row);
                return (
                  <tr
                    key={row.campaignId}
                    className="fade-up"
                    style={{
                      animationDelay: `${i * 0.04}s`,
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
                      <span title={m.resultadoLabel}>{formatNumber(m.resultado)}</span>
                      <span
                        style={{
                          marginLeft: 4,
                          fontSize: 10,
                          color: 'var(--text-muted)',
                          fontFamily: 'var(--sans)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {m.resultadoLabel}
                      </span>
                    </td>
                    <td style={{ ...TD, textAlign: 'right', color: 'var(--red)' }}>
                      {m.cpr > 0 ? (
                        <>
                          {formatBRL(m.cpr)}
                          <span
                            style={{
                              marginLeft: 4,
                              fontSize: 10,
                              color: 'var(--text-muted)',
                              fontFamily: 'var(--sans)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.06em',
                            }}
                          >
                            {m.cprLabel}
                          </span>
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
