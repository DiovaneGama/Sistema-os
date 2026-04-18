-- ============================================================
-- 008_seed.sql — Dados iniciais para desenvolvimento/testes
-- ============================================================
-- ATENÇÃO: Este seed cria um usuário de teste.
-- Execute APENAS em ambiente de desenvolvimento.
-- Em produção, crie usuários via Supabase Auth Dashboard.

-- Nota: O perfil é criado automaticamente via trigger do Supabase Auth
-- Após criar o usuário no dashboard, execute o UPDATE abaixo para definir o papel:

-- UPDATE profiles SET role = 'admin_master', full_name = 'Admin Teste' WHERE id = '<user-uuid>';

-- Clientes de exemplo
INSERT INTO clients (company_name, nickname, unit_city, contact_name, email, phone, price_per_cm2, substrates, plate_thicknesses, ink_types)
VALUES
  ('Etitec Embalagens Ltda',    'Etitec',   'São Paulo - SP',  'Carlos Silva',  'carlos@etitec.com.br',   '(11) 99999-0001', 0.09, ARRAY['metalizado', 'transparente'], ARRAY['1.14', '1.70'], ARRAY['agua']),
  ('Alimentos Oliveira S/A',    'Oliveira', 'Campinas - SP',   'Ana Oliveira',  'ana@alimentosoliveira.com.br', '(19) 99999-0002', 0.085, ARRAY['couch', 'bopp_fosco'], ARRAY['1.70', '2.84'], ARRAY['solvente']),
  ('Distribuidora Norte Flex',  'NorteFlex','Manaus - AM',     'Paulo Norte',   'paulo@norteflex.com.br', '(92) 99999-0003', 0.095, ARRAY['leitoso', 'transparente'], ARRAY['1.14'], ARRAY['agua', 'uv']);

-- Configurações adicionais de desenvolvimento
INSERT INTO system_config (key, value, description) VALUES
  ('fuso_horario', 'America/Sao_Paulo', 'Fuso horário padrão para timestamps e relatórios')
ON CONFLICT (key) DO NOTHING;
