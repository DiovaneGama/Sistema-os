-- Migration 010: Add substrate and service_name to order_specs
-- These fields are needed for the nomenclature engine

ALTER TABLE order_specs
  ADD COLUMN IF NOT EXISTS substrate TEXT,          -- ex: 'metalizado', 'transparente', 'bopp'
  ADD COLUMN IF NOT EXISTS service_name TEXT;       -- ex: 'Alimentos Oliveira', 'Logo Etitec'

-- Also add sort_order to orders if migration 009 wasn't run
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_orders_sort_order ON orders(sort_order);
CREATE INDEX IF NOT EXISTS idx_order_specs_substrate ON order_specs(substrate);
