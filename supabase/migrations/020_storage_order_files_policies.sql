-- ============================================================
-- 020_storage_order_files_policies.sql
-- Policies de upload e leitura pública para o bucket order-files.
-- Execute após criar o bucket via Dashboard ou SQL.
-- ============================================================

-- Leitura pública (sem autenticação)
CREATE POLICY "order_files_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'order-files');

-- Upload para usuários autenticados
CREATE POLICY "order_files_authenticated_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'order-files');

-- Substituição de arquivo (upsert usa UPDATE)
CREATE POLICY "order_files_authenticated_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'order-files');
