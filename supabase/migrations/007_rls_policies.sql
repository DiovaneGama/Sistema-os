-- ============================================================
-- 007_rls_policies.sql — Row Level Security por papel (RBAC)
-- Idempotente: pode ser executado múltiplas vezes sem erro
-- ============================================================

-- Helper: retorna o papel do usuário logado
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ===== HABILITAR RLS EM TODAS AS TABELAS =====
ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_specs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_colors     ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrap_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_issues     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs       ENABLE ROW LEVEL SECURITY;

-- ===== LIMPAR POLÍTICAS EXISTENTES (idempotência) =====
DROP POLICY IF EXISTS "clients_select"               ON clients;
DROP POLICY IF EXISTS "clients_insert"               ON clients;
DROP POLICY IF EXISTS "clients_update"               ON clients;

DROP POLICY IF EXISTS "profiles_select_own"          ON profiles;
DROP POLICY IF EXISTS "profiles_manage"              ON profiles;

DROP POLICY IF EXISTS "config_select"                ON system_config;
DROP POLICY IF EXISTS "config_update"                ON system_config;

DROP POLICY IF EXISTS "orders_select"                ON orders;
DROP POLICY IF EXISTS "orders_insert"                ON orders;
DROP POLICY IF EXISTS "orders_update"                ON orders;
DROP POLICY IF EXISTS "orders_no_reopen_dispatched"  ON orders;

DROP POLICY IF EXISTS "specs_select"                 ON order_specs;
DROP POLICY IF EXISTS "specs_insert"                 ON order_specs;
DROP POLICY IF EXISTS "specs_update"                 ON order_specs;

DROP POLICY IF EXISTS "colors_select"                ON order_colors;
DROP POLICY IF EXISTS "colors_manage"                ON order_colors;

DROP POLICY IF EXISTS "financials_select"            ON order_financials;
DROP POLICY IF EXISTS "financials_manage"            ON order_financials;

DROP POLICY IF EXISTS "quotes_select"                ON quotes;
DROP POLICY IF EXISTS "quotes_manage"                ON quotes;

DROP POLICY IF EXISTS "commissions_select_own"       ON commissions;
DROP POLICY IF EXISTS "commissions_update"           ON commissions;

DROP POLICY IF EXISTS "scrap_select"                 ON scrap_records;
DROP POLICY IF EXISTS "scrap_insert"                 ON scrap_records;

DROP POLICY IF EXISTS "issues_select"                ON order_issues;
DROP POLICY IF EXISTS "issues_manage"                ON order_issues;

DROP POLICY IF EXISTS "audit_select"                 ON audit_logs;

-- ===== CLIENTS =====
CREATE POLICY "clients_select" ON clients FOR SELECT TO authenticated USING (true);
CREATE POLICY "clients_insert" ON clients FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "clients_update" ON clients FOR UPDATE TO authenticated
  USING (current_user_role() IN ('sysadmin', 'admin_master', 'gestor_pcp', 'comercial'));

-- ===== PROFILES =====
CREATE POLICY "profiles_select_own" ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR current_user_role() IN ('sysadmin', 'admin_master', 'gestor_pcp'));
CREATE POLICY "profiles_manage" ON profiles FOR ALL TO authenticated
  USING (current_user_role() = 'sysadmin')
  WITH CHECK (current_user_role() = 'sysadmin');

-- ===== SYSTEM_CONFIG =====
CREATE POLICY "config_select" ON system_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "config_update" ON system_config FOR UPDATE TO authenticated
  USING (current_user_role() IN ('sysadmin', 'admin_master'));

-- ===== ORDERS =====
CREATE POLICY "orders_select" ON orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "orders_insert" ON orders FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN (
    'sysadmin', 'admin_master', 'gestor_pcp', 'comercial', 'arte_finalista', 'triador'
  ));
CREATE POLICY "orders_update" ON orders FOR UPDATE TO authenticated
  USING (
    current_user_role() IN ('sysadmin', 'admin_master', 'gestor_pcp', 'arte_finalista', 'comercial', 'triador')
    OR (
      current_user_role() = 'clicherista'
      AND status IN ('fila_producao', 'producao', 'pronto')
    )
  );
CREATE POLICY "orders_no_reopen_dispatched" ON orders FOR UPDATE TO authenticated
  USING (
    status != 'despachado'
    OR current_user_role() IN ('sysadmin', 'admin_master')
  );

-- ===== ORDER_SPECS =====
CREATE POLICY "specs_select" ON order_specs FOR SELECT TO authenticated USING (true);
CREATE POLICY "specs_insert" ON order_specs FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN (
    'sysadmin', 'admin_master', 'gestor_pcp', 'arte_finalista'
  ));
CREATE POLICY "specs_update" ON order_specs FOR UPDATE TO authenticated
  USING (
    frozen = false
    OR current_user_role() IN ('sysadmin', 'admin_master')
  );

-- ===== ORDER_COLORS =====
CREATE POLICY "colors_select" ON order_colors FOR SELECT TO authenticated USING (true);
CREATE POLICY "colors_manage" ON order_colors FOR ALL TO authenticated
  USING (current_user_role() IN (
    'sysadmin', 'admin_master', 'gestor_pcp', 'arte_finalista', 'comercial'
  ));

-- ===== ORDER_FINANCIALS =====
CREATE POLICY "financials_select" ON order_financials FOR SELECT TO authenticated
  USING (current_user_role() IN (
    'sysadmin', 'admin_master', 'gestor_pcp', 'comercial', 'arte_finalista'
  ));
CREATE POLICY "financials_manage" ON order_financials FOR ALL TO authenticated
  USING (current_user_role() IN (
    'sysadmin', 'admin_master', 'gestor_pcp', 'comercial', 'arte_finalista'
  ));

-- ===== QUOTES =====
CREATE POLICY "quotes_select" ON quotes FOR SELECT TO authenticated
  USING (current_user_role() IN (
    'sysadmin', 'admin_master', 'gestor_pcp', 'comercial', 'arte_finalista'
  ));
CREATE POLICY "quotes_manage" ON quotes FOR ALL TO authenticated
  USING (current_user_role() IN (
    'sysadmin', 'admin_master', 'gestor_pcp', 'comercial'
  ));

-- ===== COMMISSIONS =====
CREATE POLICY "commissions_select_own" ON commissions FOR SELECT TO authenticated
  USING (
    profile_id = auth.uid()
    OR current_user_role() IN ('sysadmin', 'admin_master', 'gestor_pcp')
  );
CREATE POLICY "commissions_update" ON commissions FOR UPDATE TO authenticated
  USING (current_user_role() IN ('sysadmin', 'admin_master'));

-- ===== SCRAP_RECORDS =====
CREATE POLICY "scrap_select" ON scrap_records FOR SELECT TO authenticated
  USING (current_user_role() IN (
    'sysadmin', 'admin_master', 'gestor_pcp', 'clicherista'
  ));
CREATE POLICY "scrap_insert" ON scrap_records FOR INSERT TO authenticated
  WITH CHECK (current_user_role() IN (
    'sysadmin', 'admin_master', 'gestor_pcp', 'clicherista'
  ));

-- ===== ORDER_ISSUES =====
CREATE POLICY "issues_select" ON order_issues FOR SELECT TO authenticated USING (true);
CREATE POLICY "issues_manage" ON order_issues FOR ALL TO authenticated
  USING (current_user_role() IN (
    'sysadmin', 'admin_master', 'gestor_pcp', 'arte_finalista'
  ));

-- ===== AUDIT_LOGS =====
CREATE POLICY "audit_select" ON audit_logs FOR SELECT TO authenticated
  USING (current_user_role() IN ('sysadmin', 'admin_master', 'gestor_pcp'));
-- Sem policy de INSERT/UPDATE/DELETE — apenas o trigger SECURITY DEFINER insere
