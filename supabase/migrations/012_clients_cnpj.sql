-- ============================================================
-- 012_clients_cnpj.sql — Adiciona campo CNPJ na tabela clients
-- ============================================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS cnpj TEXT;
