const TZ = 'America/Sao_Paulo';

function toSP(date: Date): Date {
  // Returns a Date adjusted to the São Paulo calendar date
  const str = date.toLocaleString('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return new Date(str + 'T00:00:00');
}

export function todaySP(): string {
  return toSP(new Date()).toISOString().slice(0, 10);
}

export function yesterdaySP(): string {
  const d = toSP(new Date());
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}
