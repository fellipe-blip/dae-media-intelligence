-- DAE Media Intelligence — Schema Supabase
-- Execute no SQL Editor do Supabase

-- Clientes
CREATE TABLE IF NOT EXISTS clients (
  id               SERIAL PRIMARY KEY,
  name             TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'churned')),
  ad_account_id    TEXT,
  crm_token        TEXT,
  monthly_budget   NUMERIC(12,2),
  objectives       TEXT[] DEFAULT '{}',
  funnel_stage_config JSONB,
  rd_fonte_field   TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- KPIs por cliente
CREATE TABLE IF NOT EXISTS client_kpis (
  id           SERIAL PRIMARY KEY,
  client_id    INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  target_value NUMERIC(12,4),
  min_value    NUMERIC(12,4),
  max_value    NUMERIC(12,4),
  type         TEXT NOT NULL DEFAULT 'lower_is_better' CHECK (type IN ('lower_is_better', 'higher_is_better', 'range')),
  weight       NUMERIC(4,2) DEFAULT 1.0,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Campanhas
CREATE TABLE IF NOT EXISTS campaigns (
  id          SERIAL PRIMARY KEY,
  client_id   INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  external_id TEXT UNIQUE,
  name        TEXT NOT NULL,
  platform    TEXT NOT NULL DEFAULT 'meta' CHECK (platform IN ('meta', 'google', 'tiktok')),
  objective   TEXT,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Ad Sets
CREATE TABLE IF NOT EXISTS ad_sets (
  id          SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  external_id TEXT UNIQUE,
  name        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Criativos
CREATE TABLE IF NOT EXISTS creatives (
  id            SERIAL PRIMARY KEY,
  ad_set_id     INTEGER REFERENCES ad_sets(id) ON DELETE CASCADE,
  campaign_id   INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  external_id   TEXT UNIQUE,
  name          TEXT NOT NULL,
  creative_type TEXT DEFAULT 'image' CHECK (creative_type IN ('image', 'video', 'carousel', 'story', 'reel')),
  thumbnail_url TEXT,
  status        TEXT NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Métricas diárias
CREATE TABLE IF NOT EXISTS metrics_daily (
  id               SERIAL PRIMARY KEY,
  client_id        INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  entity_type      TEXT NOT NULL CHECK (entity_type IN ('campaign', 'ad_set', 'creative')),
  entity_id        INTEGER NOT NULL,
  date             DATE NOT NULL,
  spend            NUMERIC(12,4) DEFAULT 0,
  impressions      INTEGER DEFAULT 0,
  reach            INTEGER DEFAULT 0,
  frequency        NUMERIC(8,4) DEFAULT 0,
  clicks           INTEGER DEFAULT 0,
  ctr              NUMERIC(8,4) DEFAULT 0,
  cpc              NUMERIC(8,4) DEFAULT 0,
  cpm              NUMERIC(8,4) DEFAULT 0,
  leads            INTEGER DEFAULT 0,
  cpl              NUMERIC(12,4) DEFAULT 0,
  messages         INTEGER DEFAULT 0,
  cost_per_message NUMERIC(12,4) DEFAULT 0,
  followers        INTEGER DEFAULT 0,
  cost_per_follower NUMERIC(12,4) DEFAULT 0,
  video_views      INTEGER DEFAULT 0,
  hook_rate        NUMERIC(8,4) DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (entity_type, entity_id, date)
);

-- Métricas CRM (funil RD Station)
CREATE TABLE IF NOT EXISTS crm_metrics (
  id        SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  date      DATE NOT NULL,
  campaign_id INTEGER REFERENCES campaigns(id),
  creative_id INTEGER REFERENCES creatives(id),
  leads     INTEGER DEFAULT 0,
  mql       INTEGER DEFAULT 0,
  sql       INTEGER DEFAULT 0,
  sales     INTEGER DEFAULT 0,
  revenue   NUMERIC(12,2) DEFAULT 0,
  spend     NUMERIC(12,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (client_id, date)
);

-- Insights gerados por IA
CREATE TABLE IF NOT EXISTS insights (
  id           SERIAL PRIMARY KEY,
  client_id    INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type         TEXT NOT NULL DEFAULT 'manual' CHECK (type IN ('weekly_wed', 'manual')),
  content      TEXT NOT NULL,
  summary      TEXT,
  impact_level TEXT DEFAULT 'medium' CHECK (impact_level IN ('high', 'medium', 'low')),
  category     TEXT DEFAULT 'performance' CHECK (category IN ('performance', 'creative', 'funnel', 'budget')),
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relatórios publicados
CREATE TABLE IF NOT EXISTS reports (
  id           SERIAL PRIMARY KEY,
  client_id    INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('weekly_mon', 'weekly_wed', 'weekly_fri', 'manual')),
  title        TEXT NOT NULL,
  content      TEXT NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Alertas
CREATE TABLE IF NOT EXISTS alerts (
  id            SERIAL PRIMARY KEY,
  client_id     INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('kpi_breach', 'frequency_high')),
  kpi_name      TEXT,
  severity      TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('critical', 'warning')),
  current_value NUMERIC(12,4),
  target_value  NUMERIC(12,4),
  message       TEXT,
  resolved      BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Atividades
CREATE TABLE IF NOT EXISTS activities (
  id            SERIAL PRIMARY KEY,
  client_id     INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'budget_change', 'creative_pause', 'creative_launch',
    'campaign_pause', 'campaign_launch', 'kpi_update',
    'note', 'meeting', 'optimization'
  )),
  title         TEXT,
  description   TEXT,
  metadata      JSONB,
  archived_at   TIMESTAMPTZ DEFAULT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Tarefas
CREATE TABLE IF NOT EXISTS tasks (
  id            SERIAL PRIMARY KEY,
  client_id     INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  custom_type   TEXT,
  due_date      DATE NOT NULL,
  assigned_to   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'cancelled')),
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_metrics_daily_client_date ON metrics_daily(client_id, date);
CREATE INDEX IF NOT EXISTS idx_metrics_daily_entity ON metrics_daily(entity_type, entity_id, date);
CREATE INDEX IF NOT EXISTS idx_crm_metrics_client_date ON crm_metrics(client_id, date);
CREATE INDEX IF NOT EXISTS idx_alerts_client ON alerts(client_id, resolved, created_at);
CREATE INDEX IF NOT EXISTS idx_activities_client ON activities(client_id, created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_client_due ON tasks(client_id, due_date, status);
CREATE INDEX IF NOT EXISTS idx_insights_client ON insights(client_id, generated_at);
CREATE INDEX IF NOT EXISTS idx_reports_client ON reports(client_id, generated_at);
