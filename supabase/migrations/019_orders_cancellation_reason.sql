-- ============================================================
-- 019_orders_cancellation_reason.sql
-- Adiciona coluna para registrar motivo de cancelamento de OS.
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
