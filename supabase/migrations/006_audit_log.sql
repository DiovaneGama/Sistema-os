-- ============================================================
-- 006_audit_log.sql — Log de auditoria imutável + triggers
-- ============================================================

-- Tabela de auditoria (append-only, sem DELETE via RLS)
CREATE TABLE audit_logs (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name   TEXT        NOT NULL,
  record_id    UUID        NOT NULL,
  action       TEXT        NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data     JSONB,
  new_data     JSONB,
  changed_by   UUID        REFERENCES profiles(id),
  changed_at   TIMESTAMPTZ DEFAULT now()
);

-- Índices para consultas rápidas por pedido e por usuário
CREATE INDEX idx_audit_record ON audit_logs(record_id);
CREATE INDEX idx_audit_table  ON audit_logs(table_name);
CREATE INDEX idx_audit_user   ON audit_logs(changed_by);

-- Função genérica de auditoria
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs(table_name, record_id, action, old_data, new_data, changed_by)
  VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)::JSONB ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW)::JSONB ELSE NULL END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger nas tabelas críticas
CREATE TRIGGER audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_order_specs
  AFTER INSERT OR UPDATE OR DELETE ON order_specs
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_quotes
  AFTER INSERT OR UPDATE OR DELETE ON quotes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_commissions
  AFTER INSERT OR UPDATE OR DELETE ON commissions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

CREATE TRIGGER audit_scrap_records
  AFTER INSERT OR UPDATE OR DELETE ON scrap_records
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn();

-- Trigger para congelar order_specs ao status entrar em produção
CREATE OR REPLACE FUNCTION freeze_specs_on_production()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'producao' AND OLD.status != 'producao' THEN
    UPDATE order_specs
       SET frozen    = true,
           frozen_at = now(),
           frozen_by = auth.uid()
     WHERE order_id = NEW.id
       AND frozen = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_freeze_specs
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION freeze_specs_on_production();

-- Trigger para calcular e inserir comissão quando OS vai para fila_producao
CREATE OR REPLACE FUNCTION create_commission_on_send_to_production()
RETURNS TRIGGER AS $$
DECLARE
  v_rate        NUMERIC(5,4);
  v_total_price NUMERIC(10,2);
BEGIN
  IF NEW.status = 'fila_producao' AND OLD.status != 'fila_producao' THEN
    -- busca taxa de comissão do operador
    SELECT commission_rate INTO v_rate
      FROM profiles WHERE id = NEW.assigned_to;

    -- busca valor total da OS
    SELECT total_price INTO v_total_price
      FROM order_financials WHERE order_id = NEW.id;

    IF v_total_price IS NOT NULL AND v_rate IS NOT NULL THEN
      INSERT INTO commissions(order_id, profile_id, stage, base_amount, rate, commission_amount)
      VALUES (
        NEW.id,
        NEW.assigned_to,
        'arte_final',
        v_total_price,
        v_rate,
        ROUND(v_total_price * v_rate, 2)
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_commission_arte_final
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION create_commission_on_send_to_production();
