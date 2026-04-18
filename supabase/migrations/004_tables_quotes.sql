-- ============================================================
-- 004_tables_quotes.sql — Orçamentos e vínculo com pedidos
-- ============================================================

CREATE TABLE quotes (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_number     TEXT         UNIQUE NOT NULL,  -- ex: ORC-2026-001
  client_id        UUID         REFERENCES clients(id),
  created_by       UUID         REFERENCES profiles(id),
  status           quote_status DEFAULT 'aguardando_aprovacao',
  version          INT          DEFAULT 1,
  parent_quote_id  UUID         REFERENCES quotes(id),  -- revisões mantêm histórico
  -- dados técnicos estimados
  num_colors       INT,
  estimated_area_cm2 NUMERIC(10,4),
  plate_thickness  TEXT,
  -- valores
  color_price      NUMERIC(10,2),
  assembly_price   NUMERIC(10,2),
  total_price      NUMERIC(10,2),
  discount_pct     NUMERIC(5,2)  DEFAULT 0,
  -- controle
  valid_until      DATE,
  rejection_reason TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ  DEFAULT now(),
  updated_at       TIMESTAMPTZ  DEFAULT now()
);

-- Número de orçamento sequencial por ano
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TEXT AS $$
DECLARE
  year_prefix TEXT;
  seq_count   INT;
BEGIN
  year_prefix := 'ORC-' || TO_CHAR(NOW(), 'YYYY') || '-';
  SELECT COUNT(*) + 1
    INTO seq_count
    FROM quotes
   WHERE quote_number LIKE year_prefix || '%';
  RETURN year_prefix || LPAD(seq_count::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_quote_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.quote_number IS NULL OR NEW.quote_number = '' THEN
    NEW.quote_number := generate_quote_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_quote_number
  BEFORE INSERT ON quotes
  FOR EACH ROW EXECUTE FUNCTION set_quote_number();

-- Adiciona FK de orders → quotes agora que a tabela existe
ALTER TABLE orders
  ADD CONSTRAINT fk_orders_quote
  FOREIGN KEY (quote_id) REFERENCES quotes(id);

-- Vencimento automático de orçamentos (chamado por cron job ou Edge Function)
CREATE OR REPLACE FUNCTION expire_quotes()
RETURNS void AS $$
BEGIN
  UPDATE quotes
     SET status = 'vencido', updated_at = now()
   WHERE status = 'aguardando_aprovacao'
     AND valid_until < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;
