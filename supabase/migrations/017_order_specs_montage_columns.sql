-- ============================================================
-- 017_order_specs_montage_columns.sql
-- Adiciona colunas de montagem que faltavam na tabela order_specs.
-- Referenciadas em useCreateOrder.ts mas ausentes no schema.
-- ============================================================

ALTER TABLE order_specs
  ADD COLUMN IF NOT EXISTS altura_faca_mm      NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS largura_faca_mm     NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS largura_material_mm NUMERIC(10,4);
