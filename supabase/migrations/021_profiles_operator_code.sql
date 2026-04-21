-- ============================================================
-- 021_profiles_operator_code.sql
-- Adiciona código numérico curto ao operador (arte_finalista).
-- Esse código compõe o prefixo do Nº OS.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS operator_code SMALLINT;

-- Garante unicidade (ignora NULLs — perfis sem código não conflitam)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_operator_code_key
  ON profiles(operator_code)
  WHERE operator_code IS NOT NULL;
