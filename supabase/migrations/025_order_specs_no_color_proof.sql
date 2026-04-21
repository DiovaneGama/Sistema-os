-- ============================================================
-- 025_order_specs_no_color_proof.sql
-- Dispensa de Prova de Cores por OS
-- Quando true, o OrderCard não bloqueia o avanço por falta
-- de color_proof_url e exibe badge "N/A" no slot.
-- ============================================================

ALTER TABLE order_specs
  ADD COLUMN IF NOT EXISTS no_color_proof BOOLEAN DEFAULT false;
