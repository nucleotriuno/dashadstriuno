-- Meta ad metrics (daily, per ad)
CREATE TABLE IF NOT EXISTS meta_ad_metrics (
  ad_id           TEXT NOT NULL,
  date_ref        TEXT NOT NULL,
  ad_name         TEXT,
  adset_id        TEXT,
  adset_name      TEXT,
  campaign_id     TEXT,
  campaign_name   TEXT,
  spend           REAL DEFAULT 0,
  impressions     INTEGER DEFAULT 0,
  clicks          INTEGER DEFAULT 0,
  reach           INTEGER DEFAULT 0,
  cpm             REAL DEFAULT 0,
  ctr             REAL DEFAULT 0,
  frequency       REAL DEFAULT 0,
  link_clicks     INTEGER DEFAULT 0,
  link_ctr        REAL DEFAULT 0,
  resultados      INTEGER DEFAULT 0,
  custo_resultado REAL DEFAULT 0,
  updated_at      TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (ad_id, date_ref)
);

-- Account info
CREATE TABLE IF NOT EXISTS meta_account (
  account_id    TEXT PRIMARY KEY,
  name          TEXT,
  currency      TEXT,
  timezone_name TEXT,
  updated_at    TEXT DEFAULT (datetime('now'))
);

-- Monthly financial data
CREATE TABLE IF NOT EXISTS meta_financeiro (
  month_start TEXT PRIMARY KEY,
  spend       REAL DEFAULT 0,
  tax         REAL DEFAULT 0,
  total       REAL DEFAULT 0,
  updated_at  TEXT DEFAULT (datetime('now'))
);
