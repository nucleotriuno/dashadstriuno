export interface KPIs {
  valorUsado: number;
  alcance: number;
  ctr: number;
  cpm: number;
  frequencia: number;
  leads: number;
  cpl: number;
  /** Link clicks — proxy for engagement/traffic result metric */
  conversas: number;
  /** Cost per link click */
  cpc: number;
  /** Dominant campaign objective for the selected period (e.g. OUTCOME_ENGAGEMENT) */
  objetivo: string;
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
  /** Campaign objective from Meta API (e.g. OUTCOME_ENGAGEMENT, OUTCOME_LEADS) */
  objetivo: string;
  valorUsado: number;
  alcance: number;
  cpm: number;
  ctr: number;
  /** Link clicks — correct metric for traffic/engagement campaigns */
  linkCliques: number;
  /** Cost per link click */
  cpc: number;
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
