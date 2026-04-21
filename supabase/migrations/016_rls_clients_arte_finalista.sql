-- ============================================================
-- 016_rls_clients_arte_finalista.sql
-- Regra de negócio atualizada: arte_finalista passou a ter
-- permissão de CRUD em clientes (cadastrar e editar).
-- ============================================================

DROP POLICY IF EXISTS "clients_update" ON clients;
DROP POLICY IF EXISTS "clients_insert" ON clients;

CREATE POLICY "clients_insert" ON clients FOR INSERT TO authenticated
  WITH CHECK (
    current_user_role() IN (
      'sysadmin', 'admin_master', 'gestor_pcp', 'comercial', 'arte_finalista'
    )
  );

CREATE POLICY "clients_update" ON clients FOR UPDATE TO authenticated
  USING (
    current_user_role() IN (
      'sysadmin', 'admin_master', 'gestor_pcp', 'comercial', 'arte_finalista'
    )
  );
