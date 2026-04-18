-- 013_profiles_username.sql
-- Adiciona coluna username à tabela profiles (usada para login via {username}@sistema.local)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
