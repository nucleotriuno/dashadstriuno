import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';
import { formatBRL, formatMonthBR } from '../lib/format';
import type { FinanceiroData } from '../types';

type YearFilter = 'todos' | '2025' | '2026';
type MonthFilter = number | null; // 1-12

const MONTH_ABBR = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const YEAR_FILTERS: YearFilter[] = ['todos', '2025', '2026'];

export function Financeiro() {
  const [data, setData] = useState<FinanceiroData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<YearFilter>('todos');
  const [monthFilter, setMonthFilter] = useState<MonthFilter>(null);

  useEffect(() => {
    setLoading(true);
    apiFetch<FinanceiroData>('/api/metrics/financeiro')
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((e: Error) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const months = data?.months ?? [];

  const filtered = months.filter((m) => {
    const year = m.monthStart.slice(0, 4);
    const month = parseInt(m.monthStart.slice(5, 7), 10);
    if (yearFilter !== 'todos' && year !== yearFilter) return false;
    if (monthFilter !== null && month !== monthFilter) return false;
    return true;
  });

  const totalSpend = filtered.reduce((s, m) => s + m.spend, 0);
  const totalTax = filtered.reduce((s, m) => s + m.tax, 0);
  const totalTotal = filtered.reduce((s, m) => s + m.total, 0);
  const maxSpend = Math.max(...filtered.map((m) => m.spend), 1);

  const filterBtnStyle = (isActive: boolean): React.CSSProperties => ({
    fontFamily: 'var(--mono)',
    fontSize: 12,
    padding: '4px 10px',
    borderRadius: 6,
    border: `1px solid ${isActive ? 'var(--border-light)' : 'var(--border)'}`,
    background: isActive ? 'var(--surface-alt)' : 'transparent',
    color: isActive ? 'var(--text)' : 'var(--text-muted)',
    cursor: 'pointer',
  });

  const TH: React.CSSProperties = {
    fontFamily: 'var(--sans)',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    padding: '10px 16px',
    borderBottom: '1px solid var(--border)',
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1000 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        {data?.account && (
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
            <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--text-dim)' }}>
              {data.account.name}
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
          Financeiro
        </h1>
        <p style={{ fontFamily: 'var(--sans)', fontSize: 14, color: 'var(--text-dim)', margin: 0 }}>
          Gasto mensal e impostos da conta de anúncios
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24 }}>
        {MONTH_ABBR.map((label, i) => {
          const m = i + 1;
          return (
            <button
              key={m}
              onClick={() => setMonthFilter(monthFilter === m ? null : m)}
              style={filterBtnStyle(monthFilter === m)}
            >
              {label}
            </button>
          );
        })}
        {YEAR_FILTERS.map((y) => (
          <button key={y} onClick={() => setYearFilter(y)} style={filterBtnStyle(yearFilter === y)}>
            {y === 'todos' ? 'Tudo' : y}
          </button>
        ))}
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

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Gasto', value: totalSpend, color: 'var(--accent)', colorDim: 'var(--accent-dim)' },
          { label: 'Impostos', value: totalTax, color: 'var(--amber)', colorDim: 'var(--amber-dim)' },
          { label: 'Total Cobrado', value: totalTotal, color: 'var(--red)', colorDim: 'var(--red-dim)' },
        ].map((card, i) => (
          <div
            key={card.label}
            className="fade-up"
            style={{
              animationDelay: `${i * 0.04}s`,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '20px',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(135deg, ${card.colorDim} 0%, transparent 60%)`,
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                fontFamily: 'var(--sans)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                marginBottom: 8,
                position: 'relative',
              }}
            >
              {card.label}
            </div>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 24,
                fontWeight: 700,
                color: loading ? 'var(--text-muted)' : card.color,
                position: 'relative',
              }}
            >
              {loading ? '—' : formatBRL(card.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Table */}
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...TH, textAlign: 'left' }}>Mês</th>
              <th style={{ ...TH, textAlign: 'right' }}>Gasto</th>
              <th style={{ ...TH, textAlign: 'right' }}>Impostos</th>
              <th style={{ ...TH, textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  Carregando...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    padding: '20px',
                    textAlign: 'center',
                  }}
                >
                  Sem dados
                </td>
              </tr>
            ) : (
              filtered.map((m, i) => (
                <tr key={m.monthStart} className="fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <td
                    style={{
                      fontFamily: 'var(--sans)',
                      fontSize: 13,
                      color: 'var(--text)',
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--border)',
                    }}
                  >
                    {formatMonthBR(m.monthStart)}
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 13,
                      color: 'var(--text)',
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'right',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <div
                        style={{
                          width: Math.round((m.spend / maxSpend) * 80),
                          height: 4,
                          background: 'var(--accent)',
                          borderRadius: 2,
                          opacity: 0.5,
                        }}
                      />
                      {formatBRL(m.spend)}
                    </div>
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 13,
                      color: m.tax > 0 ? 'var(--amber)' : 'var(--text-muted)',
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'right',
                    }}
                  >
                    {m.tax > 0 ? formatBRL(m.tax) : '—'}
                  </td>
                  <td
                    style={{
                      fontFamily: 'var(--mono)',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--text)',
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--border)',
                      textAlign: 'right',
                    }}
                  >
                    {formatBRL(m.total)}
                  </td>
                </tr>
              ))
            )}
            {/* Totals row */}
            {!loading && filtered.length > 0 && (
              <tr style={{ background: 'var(--surface-alt)' }}>
                <td style={{ fontFamily: 'var(--sans)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', padding: '10px 16px' }}>
                  Total
                </td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--accent)', padding: '10px 16px', textAlign: 'right' }}>
                  {formatBRL(totalSpend)}
                </td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--amber)', padding: '10px 16px', textAlign: 'right' }}>
                  {totalTax > 0 ? formatBRL(totalTax) : '—'}
                </td>
                <td style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: 'var(--text)', padding: '10px 16px', textAlign: 'right' }}>
                  {formatBRL(totalTotal)}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Timestamp */}
        {data?.updatedAt && (
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: 'var(--text-muted)',
              padding: '10px 16px',
              borderTop: '1px solid var(--border)',
              textAlign: 'right',
            }}
          >
            Atualizado em{' '}
            {new Date(data.updatedAt).toLocaleString('pt-BR', {
              timeZone: 'America/Sao_Paulo',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>
    </div>
  );
}
