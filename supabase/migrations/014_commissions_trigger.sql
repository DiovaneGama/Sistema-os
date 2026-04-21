-- ============================================================
-- 014_commissions_trigger.sql
-- Auto-cria comissão para o arte_finalista quando OS vai para fila_producao
-- ============================================================

CREATE OR REPLACE FUNCTION auto_create_commission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'fila_producao'
     AND OLD.status <> 'fila_producao'
     AND NEW.assigned_to IS NOT NULL
  THEN
    INSERT INTO commissions (order_id, profile_id, stage, base_amount, rate, commission_amount)
    SELECT
      NEW.id,
      NEW.assigned_to,
      'arte_final',
      COALESCE((SELECT SUM(price) FROM order_colors WHERE order_id = NEW.id), 0),
      COALESCE((SELECT commission_rate FROM profiles WHERE id = NEW.assigned_to), 0),
      COALESCE((SELECT SUM(price) FROM order_colors WHERE order_id = NEW.id), 0)
        * COALESCE((SELECT commission_rate FROM profiles WHERE id = NEW.assigned_to), 0)
    WHERE NOT EXISTS (
      SELECT 1 FROM commissions
       WHERE order_id = NEW.id
         AND stage = 'arte_final'
         AND reversed = false
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_auto_commission
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION auto_create_commission();
