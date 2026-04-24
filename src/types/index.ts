export interface KPIs {
  valorUsado: number;
  alcance: number;
  ctr: number;
  cpm: number;
  frequencia: number;
  leads: number;
  cpl: number;
  updatedAt: string | null;
}

export interface TimeseriesPoint {
  date: string;
  valorUsado: number;
  leads: number;
}

export interface CampaignRow {
  campaignId: string;
  campaignName: string;
  valorUsado: number;
  alcance: number;
  cpm: number;
  ctr: number;
  resultados: number;
  custoPorResultado: number;
}

export interface AdRow {
  adId: string;
  adName: string;
  valorUsado: number;
  alcance: number;
  cpm: number;
  ctr: number;
  impressions: number;
  resultados: number;
  custoPorResultado: number;
}

export interface AccountInfo {
  name: string;
  accountId: string;
  currency: string;
  timezone: string;
}

export interface FinanceiroMonth {
  monthStart: string;
  spend: number;
  tax: number;
  total: number;
}

export interface FinanceiroData {
  account: AccountInfo | null;
  months: FinanceiroMonth[];
  updatedAt: string;
}

export type TimeWindow =
  | 'hoje'
  | 'ontem'
  | '7dias'
  | '14dias'
  | '30dias'
  | 'este-mes'
  | 'mes-passado';

export interface Account {
  id: string;
  name: string;
}
