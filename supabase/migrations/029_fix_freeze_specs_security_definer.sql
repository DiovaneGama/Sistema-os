-- A função freeze_specs_on_production rodava com permissões do usuário autenticado,
-- causando violação de RLS ao tentar UPDATE em order_specs durante o avanço para producao.
-- SECURITY DEFINER faz a função rodar como owner (postgres), bypassando RLS.

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
$$ LANGUAGE plpgsql SECURITY DEFINER;
