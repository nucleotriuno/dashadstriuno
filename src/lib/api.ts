import { formatInTimeZone } from 'date-fns-tz';
import { subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import type { TimeWindow } from '../types';

const TZ = 'America/Sao_Paulo';

export function getDateRange(window: TimeWindow): { startDate: string; endDate: string } {
  const now = new Date();
  const today = formatInTimeZone(now, TZ, 'yyyy-MM-dd');
  const yesterday = formatInTimeZone(subDays(now, 1), TZ, 'yyyy-MM-dd');

  switch (window) {
    case 'hoje':
      return { startDate: today, endDate: today };
    case 'ontem':
      return { startDate: yesterday, endDate: yesterday };
    case '7dias':
      return {
        startDate: formatInTimeZone(subDays(now, 6), TZ, 'yyyy-MM-dd'),
        endDate: today,
      };
    case '14dias':
      return {
        startDate: formatInTimeZone(subDays(now, 13), TZ, 'yyyy-MM-dd'),
        endDate: today,
      };
    case '30dias':
      return {
        startDate: formatInTimeZone(subDays(now, 29), TZ, 'yyyy-MM-dd'),
        endDate: today,
      };
    case 'este-mes': {
      const start = startOfMonth(now);
      return {
        startDate: formatInTimeZone(start, TZ, 'yyyy-MM-dd'),
        endDate: today,
      };
    }
    case 'mes-passado': {
      const lastMonth = subMonths(now, 1);
      const start = startOfMonth(lastMonth);
      const end = endOfMonth(lastMonth);
      return {
        startDate: formatInTimeZone(start, TZ, 'yyyy-MM-dd'),
        endDate: formatInTimeZone(end, TZ, 'yyyy-MM-dd'),
      };
    }
  }
}

async function apiFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(path, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString());
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error: string }).error || res.statusText);
  }
  return res.json() as Promise<T>;
}

export { apiFetch };
