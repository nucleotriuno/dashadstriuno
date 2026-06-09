import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TimeseriesPoint } from '../types';
import { formatBRL, formatDateBR } from '../lib/format';

interface Props {
  data: TimeseriesPoint[];
  loading: boolean;
  objetivo?: string;
}

function isEngagementLike(obj: string) {
  return (
    obj === 'OUTCOME_ENGAGEMENT' ||
    obj === 'OUTCOME_TRAFFIC' ||
    obj === 'OUTCOME_APP_PROMOTION'
  );
}

export function SpendChart({ data, loading, objetivo = '' }: Props) {
  const useConversas = isEngagementLike(objetivo);
  const resultKey = useConversas ? 'conversas' : 'leads';
  const resultLabel = useConversas ? 'Cliques' : 'Leads';

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 12,
        padding: '16px 20px',
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
          marginBottom: 12,
        }}
      >
        Gasto Diário
      </div>
      {loading || data.length === 0 ? (
        <div
          style={{
            height: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            fontFamily: 'var(--mono)',
            fontSize: 13,
          }}
        >
          {loading ? 'Carregando...' : 'Sem dados'}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={(v: string) => formatDateBR(v)}
              tick={{ fontSize: 11, fontFamily: 'var(--mono)', fill: 'var(--text-dim)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="spend"
              tickFormatter={(v: number) =>
                v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
              }
              tick={{ fontSize: 11, fontFamily: 'var(--mono)', fill: 'var(--text-dim)' }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <YAxis
              yAxisId="leads"
              orientation="right"
              allowDecimals={false}
              tick={{ fontSize: 11, fontFamily: 'var(--mono)', fill: 'var(--text-dim)' }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface-alt)',
                border: '1px solid var(--border-light)',
                borderRadius: 8,
                fontFamily: 'var(--mono)',
                fontSize: 12,
              }}
              formatter={(value: unknown, name: unknown) =>
                name === 'valorUsado'
                  ? [formatBRL(value as number), 'Gasto']
                  : [String(value), resultLabel]
              }
              labelFormatter={(label: unknown) => formatDateBR(label as string)}
            />
            <Legend
              formatter={(value) => value === 'valorUsado' ? 'Gasto' : resultLabel}
              wrapperStyle={{ fontFamily: 'var(--mono)', fontSize: 11 }}
            />
            <Line
              yAxisId="spend"
              type="monotone"
              dataKey="valorUsado"
              stroke="var(--amber)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="leads"
              type="monotone"
              dataKey={resultKey}
              stroke="var(--green)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
