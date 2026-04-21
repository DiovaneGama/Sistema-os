-- 027_orders_created_by.sql
-- Vincula o rascunho de OS ao usuário que iniciou o cadastro.
-- Permite que cada usuário tenha no máximo um rascunho ativo (status='rascunho').

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;
