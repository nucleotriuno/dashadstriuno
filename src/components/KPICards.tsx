import type { KPIs } from '../types';
import { formatBRL, formatNumber, formatPercent } from '../lib/format';

interface Props {
  kpis: KPIs | null;
  loading: boolean;
}

interface CardDef {
  label: string;
  value: (k: KPIs) => string;
  color: string;
}

type Objetivo = string;

function getObjetivoLabels(objetivo: Objetivo): { resultadoLabel: string; cprLabel: string } {
  switch (objetivo) {
    case 'OUTCOME_ENGAGEMENT':
      return { resultadoLabel: 'Cliques', cprLabel: 'CPC' };
    case 'OUTCOME_TRAFFIC':
      return { resultadoLabel: 'Cliques', cprLabel: 'CPC' };
    case 'OUTCOME_SALES':
      return { resultadoLabel: 'Vendas', cprLabel: 'CPV' };
    case 'OUTCOME_AWARENESS':
      return { resultadoLabel: 'Alcance', cprLabel: 'CPM' };
    case 'OUTCOME_APP_PROMOTION':
      return { resultadoLabel: 'Cliques', cprLabel: 'CPC' };
    default:
      return { resultadoLabel: 'Leads', cprLabel: 'CPL' };
  }
}

function buildCards(objetivo: Objetivo): CardDef[] {
  const { resultadoLabel, cprLabel } = getObjetivoLabels(objetivo);
  const isEngOrTraffic =
    objetivo === 'OUTCOME_ENGAGEMENT' ||
    objetivo === 'OUTCOME_TRAFFIC' ||
    objetivo === 'OUTCOME_APP_PROMOTION';
  const isAwareness = objetivo === 'OUTCOME_AWARENESS';

  return [
    {
      label: 'Valor Usado',
      value: (k) => formatBRL(k.valorUsado),
      color: 'var(--amber)',
    },
    {
      label: resultadoLabel,
      value: (k) => {
        if (isAwareness) return formatNumber(k.alcance);
        if (isEngOrTraffic) return formatNumber(k.conversas ?? 0);
        return formatNumber(k.leads);
      },
      color: 'var(--green)',
    },
    {
      label: cprLabel,
      value: (k) => {
        if (isAwareness) return formatBRL(k.cpm);
        if (isEngOrTraffic) return formatBRL(k.cpc ?? 0);
        return formatBRL(k.cpl);
      },
      color: 'var(--red)',
    },
    {
      label: 'Alcance',
      value: (k) => formatNumber(k.alcance),
      color: 'var(--accent)',
    },
    {
      label: 'CTR',
      value: (k) => formatPercent(k.ctr),
      color: 'var(--text-dim)',
    },
    {
      label: 'CPM',
      value: (k) => formatBRL(k.cpm),
      color: 'var(--text-dim)',
    },
    {
      label: 'Frequência',
      value: (k) =>
        k.frequencia.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      color: 'var(--purple)',
    },
  ];
}

export function KPICards({ kpis, loading }: Props) {
  const objetivo = kpis?.objetivo ?? '';
  const CARDS = buildCards(objetivo);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 12,
      }}
    >
      {CARDS.map((card, i) => (
        <div
          key={card.label}
          className="fade-up"
          style={{
            animationDelay: `${i * 0.04}s`,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--sans)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}
          >
            {card.label}
          </div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 22,
              fontWeight: 700,
              color: loading ? 'var(--text-muted)' : card.color,
            }}
          >
            {loading || !kpis ? '—' : card.value(kpis)}
          </div>
        </div>
      ))}
    </div>
  );
}
