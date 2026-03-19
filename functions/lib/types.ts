export interface Env {
  META_ACCESS_TOKEN: string;
  META_AD_ACCOUNTS: string; // JSON: [{"id":"act_123","name":"Cliente A"},...]
  SYNC_SECRET: string;
  DB: D1Database;
}
