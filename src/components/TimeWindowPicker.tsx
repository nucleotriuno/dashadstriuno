import type { TimeWindow } from '../types';

interface Props {
  value: TimeWindow;
  onChange: (w: TimeWindow) => void;
}

const OPTIONS: { label: string; value: TimeWindow }[] = [
  { label: 'Hoje', value: 'hoje' },
  { label: 'Ontem', value: 'ontem' },
  { label: '7 dias', value: '7dias' },
  { label: '14 dias', value: '14dias' },
  { label: '30 dias', value: '30dias' },
  { label: 'Este mês', value: 'este-mes' },
  { label: 'Mês passado', value: 'mes-passado' },
];

export function TimeWindowPicker({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 12,
            padding: '4px 12px',
            borderRadius: 6,
            border: `1px solid ${value === opt.value ? 'var(--border-light)' : 'var(--border)'}`,
            background: value === opt.value ? 'var(--surface-alt)' : 'transparent',
            color: value === opt.value ? 'var(--text)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
