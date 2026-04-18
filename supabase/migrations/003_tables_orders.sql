-- ============================================================
-- 003_tables_orders.sql — Pedidos, especificações técnicas, cores e financeiro
-- ============================================================

-- Pedidos (coração do sistema)
CREATE TABLE orders (
  id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number           TEXT         UNIQUE NOT NULL,   -- gerado por função: DDMMYYYY + seq
  client_id              UUID         REFERENCES clients(id),
  quote_id               UUID,                           -- FK para quotes (adicionada na 004)
  status                 order_status DEFAULT 'rascunho',
  channel                order_channel NOT NULL,
  assigned_to            UUID         REFERENCES profiles(id), -- operador com trava de concorrência
  briefing               TEXT,                           -- instruções do atendimento
  file_path              TEXT,                           -- caminho de rede ou link externo
  thumbnail_url          TEXT,                           -- miniatura leve (JPG/PNG) — identidade visual
  original_filename      TEXT,                           -- nome original do arquivo recebido
  -- timestamps de cada etapa (base dos KPIs de lead time)
  queued_at              TIMESTAMPTZ,                    -- entrou na fila de arte
  treatment_started_at   TIMESTAMPTZ,                    -- arte finalista abriu
  treatment_ended_at     TIMESTAMPTZ,                    -- arte finalista enviou para produção
  production_queued_at   TIMESTAMPTZ,                    -- entrou na fila de produção
  production_started_at  TIMESTAMPTZ,                    -- clicherista iniciou
  production_ended_at    TIMESTAMPTZ,                    -- clicherista finalizou
  dispatched_at          TIMESTAMPTZ,                    -- despachado
  -- flags
  is_urgent              BOOLEAN      DEFAULT false,
  is_rework              BOOLEAN      DEFAULT false,
  parent_order_id        UUID         REFERENCES orders(id),  -- OS filha de retrabalho
  created_at             TIMESTAMPTZ  DEFAULT now(),
  updated_at             TIMESTAMPTZ  DEFAULT now()
);

-- Função para gerar número de pedido no formato DDMMYYYY + sequência (3 dígitos)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  today_prefix TEXT;
  seq_count    INT;
BEGIN
  today_prefix := TO_CHAR(NOW(), 'DDMMYYYY');
  SELECT COUNT(*) + 1
    INTO seq_count
    FROM orders
   WHERE order_number LIKE today_prefix || '%';
  RETURN today_prefix || LPAD(seq_count::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-preencher order_number antes do INSERT
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_order_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Especificações técnicas da OS (separadas para facilitar o congelamento)
CREATE TABLE order_specs (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id             UUID        UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  -- máquina
  band_type            band_type,
  target_machine       TEXT,
  print_type           print_type,
  cylinder_diameter    NUMERIC(8,2),
  gear_z               INT,                    -- Z da engrenagem (apenas banda estreita)
  front_and_back       BOOLEAN     DEFAULT false, -- frente e verso (apenas banda larga)
  -- clichê
  plate_thickness      NUMERIC(5,2),           -- ex: 1.14, 1.70, 2.84
  distortion_pct       NUMERIC(5,2),
  lineature            INT,                    -- linhas/cm
  -- layout
  repetitions          INT,
  rows                 INT,
  has_conjugated_item  BOOLEAN     DEFAULT false,
  is_pre_assembled     BOOLEAN     DEFAULT false, -- arquivo já veio montado pelo cliente
  -- nomenclaturas geradas automaticamente
  network_filename     TEXT,                   -- padrão de rede da empresa
  production_filename  TEXT,                   -- padrão para produção diária
  camerom_id           TEXT,                   -- identificação para o camerom
  -- congelamento (imutável ao entrar em produção)
  frozen               BOOLEAN     DEFAULT false,
  frozen_at            TIMESTAMPTZ,
  frozen_by            UUID        REFERENCES profiles(id),
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);

-- Cores por OS (cada cor tem suas próprias dimensões e valor)
CREATE TABLE order_colors (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID        REFERENCES orders(id) ON DELETE CASCADE,
  color_name   TEXT        NOT NULL,   -- ex: Cyan, Magenta, PANTONE 485 C
  width_cm     NUMERIC(8,2),
  height_cm    NUMERIC(8,2),
  area_cm2     NUMERIC(10,4) GENERATED ALWAYS AS (width_cm * height_cm) STORED,
  num_sets     INT         DEFAULT 1,  -- jogos de clichê para esta cor
  price        NUMERIC(10,2),
  sort_order   INT         DEFAULT 0
);

-- Valores financeiros da OS (consolidado)
CREATE TABLE order_financials (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id         UUID        UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  total_area_cm2   NUMERIC(10,4),
  assembly_price   NUMERIC(10,2) DEFAULT 0,  -- valor de fechamento/montagem
  colors_total     NUMERIC(10,2) DEFAULT 0,  -- soma dos valores de todas as cores
  total_price      NUMERIC(10,2) DEFAULT 0,  -- valor final
  has_prior_quote  BOOLEAN     DEFAULT false, -- se existia orçamento aprovado previamente
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
