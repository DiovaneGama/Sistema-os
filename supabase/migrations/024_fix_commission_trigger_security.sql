-- Corrige o trigger de comissão para rodar como SECURITY DEFINER
-- evitando falha de RLS ao inserir em commissions

CREATE OR REPLACE FUNCTION create_commission_on_send_to_production()
RETURNS TRIGGER AS $$
DECLARE
  v_rate        NUMERIC(5,4);
  v_total_price NUMERIC(10,2);
BEGIN
  IF NEW.status = 'fila_producao' AND OLD.status != 'fila_producao' THEN
    SELECT commission_rate INTO v_rate
      FROM profiles WHERE id = NEW.assigned_to;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;
