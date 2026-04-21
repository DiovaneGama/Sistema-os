-- ============================================================
-- 015_clients_units_machines.sql
-- Adiciona colunas units (array de unidades/cidades) e machines
-- (JSONB com perfil técnico por máquina) na tabela clients.
-- units substitui o campo legado unit_city (mantido por compatibilidade).
-- ============================================================

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS units    TEXT[]  DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS machines JSONB   DEFAULT '[]';

-- Migrar dados legados: unit_city → units (se unit_city tiver valor)
UPDATE clients
  SET units = ARRAY[unit_city]
  WHERE unit_city IS NOT NULL
    AND unit_city <> ''
    AND (units IS NULL OR units = '{}');
