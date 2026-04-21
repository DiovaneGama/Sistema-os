-- ============================================================
-- 022_order_number_operator.sql
-- Novo sistema de numeracao de OS:
--   Criacao: seq global (ex: 001, 002 ... dinamico)
--   Tratamento: operator_code + seq (ex: 10001, 05002)
-- ============================================================

-- Sequence global: fonte da verdade para o numero sequencial
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Coluna auxiliar: armazena o inteiro puro da sequencia
-- Permite reconstruir o numero apos associar o operador
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_seq INT;

-- Trigger de geracao no INSERT
CREATE OR REPLACE FUNCTION generate_order_number_seq()
RETURNS TRIGGER AS $$
DECLARE
  seq_val INT;
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    seq_val          := nextval('order_number_seq');
    NEW.order_seq    := seq_val;
    NEW.order_number := LPAD(seq_val::TEXT, 3, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Substitui o trigger anterior (gerava DDMMYYYY + seq)
DROP TRIGGER IF EXISTS trg_set_order_number ON orders;

CREATE TRIGGER trg_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_number_seq();

-- RPC: aplica prefixo do operador ao No OS
-- Usa UPDATE com FROM para evitar variaveis intermediarias
-- Idempotente: se operador nao tiver codigo, nao altera nada
CREATE OR REPLACE FUNCTION apply_operator_order_number(
  p_order_id    UUID,
  p_operator_id UUID
)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  UPDATE orders o
  SET order_number = p.operator_code::TEXT || LPAD(o.order_seq::TEXT, 3, '0')
  FROM profiles p
  WHERE p.id           = p_operator_id
    AND o.id           = p_order_id
    AND p.operator_code IS NOT NULL
    AND o.order_seq     IS NOT NULL
  RETURNING o.order_number INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
