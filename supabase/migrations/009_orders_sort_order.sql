-- ============================================================
-- 009_orders_sort_order.sql — Prioridade manual na fila (drag & drop)
-- ============================================================

-- Adiciona campo de ordenação manual por etapa
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- Índice para ordenação eficiente na fila
CREATE INDEX IF NOT EXISTS idx_orders_status_sort ON orders(status, sort_order, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_client      ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_assigned    ON orders(assigned_to);
CREATE INDEX IF NOT EXISTS idx_orders_created     ON orders(created_at DESC);
