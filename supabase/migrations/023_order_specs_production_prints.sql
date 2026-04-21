-- Campos de imagem para controle visual de produção
ALTER TABLE order_specs
  ADD COLUMN IF NOT EXISTS machine_print_url  TEXT,
  ADD COLUMN IF NOT EXISTS color_proof_url    TEXT;
