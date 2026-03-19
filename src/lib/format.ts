export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}

/**
 * Formats a percentage value where `value` is already on a 0–100 scale.
 * e.g. formatPercent(2.34) → "2,34%"
 * Note: Meta API returns CTR as decimal (0.0234) — multiply by 100 before calling this.
 */
export function formatPercent(value: number): string {
  return (
    value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + '%'
  );
}

export function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR');
}

export function formatDateBR(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

export function formatMonthBR(dateStr: string): string {
  // T12:00:00 prevents UTC-midnight from shifting the date to the previous day in SP timezone
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  });
}
