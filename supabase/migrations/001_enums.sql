-- ============================================================
-- 001_enums.sql — Tipos enumerados do sistema ManOS
-- ============================================================

-- Papéis (RBAC)
CREATE TYPE user_role AS ENUM (
  'sysadmin',
  'admin_master',
  'gestor_pcp',
  'comercial',
  'arte_finalista',
  'clicherista',
  'triador'
);

-- Status da esteira de produção
CREATE TYPE order_status AS ENUM (
  'rascunho',
  'fila_arte',
  'tratamento',
  'pausado',
  'fila_producao',
  'producao',
  'pronto',
  'faturamento',
  'despachado',
  'devolvido',
  'cancelado'
);

-- Status do orçamento
CREATE TYPE quote_status AS ENUM (
  'aguardando_aprovacao',
  'aprovado',
  'reprovado',
  'vencido',
  'revisado'
);

-- Canal de origem do pedido
CREATE TYPE order_channel AS ENUM (
  'email',
  'whatsapp',
  'balcao',
  'telefone',
  'orcamento',
  'outros'
);

-- Tipo de banda da máquina
CREATE TYPE band_type AS ENUM ('larga', 'estreita');

-- Tipo de impressão
CREATE TYPE print_type AS ENUM ('interna', 'externa');
