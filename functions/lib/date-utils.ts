const TZ = 'America/Sao_Paulo';

function dateSP(date: Date): string {
  // toLocaleString with en-CA returns YYYY-MM-DD format directly in the target timezone
  return date.toLocaleString('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function todaySP(): string {
  return dateSP(new Date());
}

export function yesterdaySP(): string {
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return dateSP(yesterday);
}
