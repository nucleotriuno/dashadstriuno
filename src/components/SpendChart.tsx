import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TimeseriesPoint } from '../types';
import { formatBRL, formatDateBR } from '../lib/format';

interface Props {
  data: TimeseriesPoint[];
  loading: boolean;
}

export function SpendChart({ data, loading }: Props) {
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
              tickFormatter={(v: number) => `R$${v.toFixed(0)}`}
              tick={{ fontSize: 11, fontFamily: 'var(--mono)', fill: 'var(--text-dim)' }}
              axisLine={false}
              tickLine={false}
              width={70}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--surface-alt)',
                border: '1px solid var(--border-light)',
                borderRadius: 8,
                fontFamily: 'var(--mono)',
                fontSize: 12,
              }}
              formatter={(value: unknown) => [formatBRL(value as number), 'Gasto']}
              labelFormatter={(label: unknown) => formatDateBR(label as string)}
            />
            <Line
              type="monotone"
              dataKey="valorUsado"
              stroke="var(--amber)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
