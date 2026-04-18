-- ============================================================
-- 005_tables_ops.sql — Comissões, refugo e problemas de arte
-- ============================================================

-- Comissões por etapa
CREATE TABLE commissions (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID        REFERENCES orders(id),
  profile_id        UUID        REFERENCES profiles(id),
  stage             TEXT        NOT NULL CHECK (stage IN ('arte_final', 'producao')),
  base_amount       NUMERIC(10,2),    -- valor base da OS
  rate              NUMERIC(5,4),     -- taxa aplicada (ex: 0.01 = 1%)
  commission_amount NUMERIC(10,2),    -- valor final da comissão
  reversed          BOOLEAN     DEFAULT false,
  reversed_reason   TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- Registros de refugo / retrabalho
CREATE TABLE scrap_records (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id           UUID        REFERENCES orders(id),
  reported_by        UUID        REFERENCES profiles(id),
  reason             TEXT        NOT NULL,  -- motivo padronizado do dropdown
  failure_stage      TEXT,                  -- em qual máquina/etapa ocorreu
  lost_width_cm      NUMERIC(8,2),
  lost_height_cm     NUMERIC(8,2),
  lost_area_cm2      NUMERIC(10,4) GENERATED ALWAYS AS (lost_width_cm * lost_height_cm) STORED,
  financial_loss     NUMERIC(10,2),         -- custo calculado: cm² * custo_cm2_polimero
  requires_art_fix   BOOLEAN     DEFAULT false,  -- se precisa voltar para arte final
  created_at         TIMESTAMPTZ DEFAULT now()
);

-- Trigger: ao registrar refugo com requires_art_fix=true, estorna comissão do arte finalista
CREATE OR REPLACE FUNCTION reverse_commission_on_rework()
RETURNS TRIGGER AS $$
DECLARE
  v_order_id UUID;
BEGIN
  IF NEW.requires_art_fix = true THEN
    UPDATE commissions
       SET reversed = true,
           reversed_reason = 'Retrabalho por erro de arte: ' || NEW.reason
     WHERE order_id = NEW.order_id
       AND stage = 'arte_final'
       AND reversed = false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reverse_commission_on_rework
  AFTER INSERT ON scrap_records
  FOR EACH ROW EXECUTE FUNCTION reverse_commission_on_rework();

-- Problemas que pausam o fluxo na arte final
CREATE TABLE order_issues (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID        REFERENCES orders(id),
  reported_by   UUID        REFERENCES profiles(id),
  category      TEXT        NOT NULL CHECK (
                              category IN ('erro_arquivo', 'falta_info_tecnica', 'duvida_montagem')
                            ),
  description   TEXT        NOT NULL,
  responsible   TEXT        NOT NULL CHECK (responsible IN ('cliente', 'supervisor')),
  screenshot_url TEXT,
  resolved      BOOLEAN     DEFAULT false,
  resolved_at   TIMESTAMPTZ,
  resolved_by   UUID        REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- Trigger: ao criar order_issue, muda status do pedido para 'pausado'
CREATE OR REPLACE FUNCTION pause_order_on_issue()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
     SET status = 'pausado', updated_at = now()
   WHERE id = NEW.order_id
     AND status = 'tratamento';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pause_order_on_issue
  AFTER INSERT ON order_issues
  FOR EACH ROW EXECUTE FUNCTION pause_order_on_issue();

-- Trigger: ao resolver issue (resolved=true), volta pedido para 'tratamento'
CREATE OR REPLACE FUNCTION resume_order_on_issue_resolved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.resolved = true AND OLD.resolved = false THEN
    NEW.resolved_at := now();
    UPDATE orders
       SET status = 'tratamento', updated_at = now()
     WHERE id = NEW.order_id
       AND status = 'pausado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_resume_order_on_issue_resolved
  BEFORE UPDATE ON order_issues
  FOR EACH ROW EXECUTE FUNCTION resume_order_on_issue_resolved();
