-- Tags reutilizáveis para intercorrências (pausas de produção)
CREATE TABLE IF NOT EXISTS issue_tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category   TEXT NOT NULL,
  title      TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (category, title)
);

-- Tabela de intercorrências por OS (pausa)
CREATE TABLE IF NOT EXISTS order_issues (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  reported_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  category     TEXT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  responsible  TEXT NOT NULL CHECK (responsible IN ('cobrar_cliente', 'acionar_supervisor')),
  screenshot_url TEXT,
  resolved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Trigger: ao inserir issue → pausa a OS
CREATE OR REPLACE FUNCTION pause_order_on_issue()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE orders
  SET status = 'pausado', updated_at = now()
  WHERE id = NEW.order_id AND status NOT IN ('cancelado', 'despachado', 'pronto');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pause_on_issue ON order_issues;
CREATE TRIGGER trg_pause_on_issue
  AFTER INSERT ON order_issues
  FOR EACH ROW EXECUTE FUNCTION pause_order_on_issue();

-- Trigger: ao resolver issue → retoma tratamento
CREATE OR REPLACE FUNCTION resume_order_on_issue_resolve()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.resolved_at IS NOT NULL AND OLD.resolved_at IS NULL THEN
    UPDATE orders
    SET status = 'tratamento', updated_at = now()
    WHERE id = NEW.order_id AND status = 'pausado';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_resume_on_issue_resolve ON order_issues;
CREATE TRIGGER trg_resume_on_issue_resolve
  AFTER UPDATE ON order_issues
  FOR EACH ROW EXECUTE FUNCTION resume_order_on_issue_resolve();

-- RLS
ALTER TABLE issue_tags   ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem tags"   ON issue_tags   FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Autenticados inserem tags" ON issue_tags  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Autenticados leem issues" ON order_issues FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Autenticados inserem issues" ON order_issues FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Autenticados atualizam issues" ON order_issues FOR UPDATE USING (auth.role() = 'authenticated');
