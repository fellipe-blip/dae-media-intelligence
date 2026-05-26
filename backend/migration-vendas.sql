-- Migration: adicionar métricas de VENDAS na tabela metrics_daily
ALTER TABLE metrics_daily ADD COLUMN IF NOT EXISTS purchases         INTEGER DEFAULT 0;
ALTER TABLE metrics_daily ADD COLUMN IF NOT EXISTS cost_per_purchase NUMERIC(12,4) DEFAULT 0;
ALTER TABLE metrics_daily ADD COLUMN IF NOT EXISTS add_to_cart       INTEGER DEFAULT 0;
