-- ============================================================
-- 002_tables_core.sql — Tabelas base: clientes, perfis, configurações
-- ============================================================

-- Clientes
CREATE TABLE clients (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name     TEXT        NOT NULL,
  nickname         TEXT        NOT NULL,           -- usado na nomenclatura de arquivos
  unit_city        TEXT,                           -- filial / cidade para diferenciar matrizes
  contact_name     TEXT,
  email            TEXT,
  phone            TEXT,
  price_per_cm2    NUMERIC(10,4),                  -- valor R$/cm² negociado com este cliente
  -- perfil técnico (múltipla escolha — arrays de texto)
  substrates       TEXT[]      DEFAULT '{}',       -- ex: ['metalizado', 'transparente', 'bopp']
  plate_thicknesses TEXT[]     DEFAULT '{}',       -- ex: ['1.14', '1.70', '2.84']
  ink_types        TEXT[]      DEFAULT '{}',       -- ex: ['agua', 'solvente', 'uv']
  active           BOOLEAN     DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Perfis de usuário (espelho de auth.users com papel)
CREATE TABLE profiles (
  id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name        TEXT        NOT NULL,
  role             user_role   NOT NULL DEFAULT 'triador',
  daily_os_goal    INT         DEFAULT 10,         -- meta diária de OSs (usado pelo Arte Finalista)
  commission_rate  NUMERIC(5,4) DEFAULT 0.01,      -- 1% padrão por OS concluída
  active           BOOLEAN     DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Configurações do sistema (chave-valor)
CREATE TABLE system_config (
  key              TEXT        PRIMARY KEY,
  value            TEXT        NOT NULL,
  description      TEXT,
  updated_by       UUID        REFERENCES profiles(id),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Dados iniciais de configuração
INSERT INTO system_config (key, value, description) VALUES
  ('custo_cm2_polimero',   '0.08',  'Custo em R$ por cm² de polímero (para cálculo de refugo)'),
  ('teto_desconto_pct',    '15',    'Percentual máximo de desconto sem aprovação do gestor'),
  ('meta_diaria_os',       '10',    'Meta padrão de OSs por dia para Arte Finalistas'),
  ('prazo_validade_orcamento_dias', '15', 'Dias de validade padrão de um orçamento');
