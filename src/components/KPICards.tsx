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

const CARDS: CardDef[] = [
  {
    label: 'Valor Usado',
    value: (k) => formatBRL(k.valorUsado),
    color: 'var(--amber)',
  },
  {
    label: 'Alcance',
    value: (k) => formatNumber(k.alcance),
    color: 'var(--accent)',
  },
  {
    label: 'CTR',
    value: (k) => formatPercent(k.ctr),
    color: 'var(--green)',
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

export function KPICards({ kpis, loading }: Props) {
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
