-- ============================================================
-- 018_order_specs_missing_columns.sql
-- Adiciona colunas usadas em useCreateOrder.ts que não existiam
-- no schema original (003_tables_orders.sql).
-- ============================================================

ALTER TABLE order_specs
  -- identificação do serviço
  ADD COLUMN IF NOT EXISTS service_type       TEXT,
  ADD COLUMN IF NOT EXISTS client_unit        TEXT,

  -- layout banda larga
  ADD COLUMN IF NOT EXISTS exit_direction     TEXT,
  ADD COLUMN IF NOT EXISTS has_conjugated     BOOLEAN      DEFAULT false,
  ADD COLUMN IF NOT EXISTS assembly_type      TEXT,
  ADD COLUMN IF NOT EXISTS cilindro_mm        NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS passo_larga_mm     NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS pistas_larga       INT,
  ADD COLUMN IF NOT EXISTS repeticoes_larga   INT,
  ADD COLUMN IF NOT EXISTS has_cameron        BOOLEAN      DEFAULT false,
  ADD COLUMN IF NOT EXISTS double_tape_mm     NUMERIC(10,4),

  -- montagem
  ADD COLUMN IF NOT EXISTS pi_value           NUMERIC(10,6),
  ADD COLUMN IF NOT EXISTS reduction_mm       NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS tracks             INT,
  ADD COLUMN IF NOT EXISTS gap_tracks_mm      NUMERIC(10,4);
