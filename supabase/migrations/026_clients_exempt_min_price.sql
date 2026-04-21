-- 026_clients_exempt_min_price.sql
-- Flag de isenção da taxa mínima de R$25,00 por cor na precificação.
-- Quando true, o PricingGateModal não aplica o piso mínimo para este cliente.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS exempt_min_price BOOLEAN NOT NULL DEFAULT false;
