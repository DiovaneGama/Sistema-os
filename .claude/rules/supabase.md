---
paths:
  - "src/lib/supabase.ts"
  - "supabase/**"
  - "src/features/auth/**"
  - "src/features/*/hooks/*.ts"
---

# Regras Supabase — Sistema ManOS

## Clientes Disponíveis
- `supabase` (`src/lib/supabase.ts`) — client anon, usado em toda a app
- `supabaseAdmin` — service role, **apenas** para criar/desativar usuários (sysadmin)

## Padrões de Query
```ts
// Sempre tipar com Database generics — nunca usar `any`
const { data, error } = await supabase
  .from('orders')
  .select('*')
  .eq('status', 'fila_arte')

if (error) throw error
```

## Tipos
- Importar de `src/types/database.ts`
- Tipos gerados manualmente — ao adicionar tabela, atualizar `database.ts`
- `UserRole`, `OrderStatus`, `QuoteStatus` etc. já estão definidos lá

## RLS
- Todas as tabelas têm RLS ativo no Supabase
- Policies são baseadas em `auth.uid()` e na coluna `role` da tabela `profiles`
- Nunca desabilitar RLS em tabela — usar `supabaseAdmin` se precisar bypass (com cautela)
- **Armadilha:** UPDATE bloqueado por RLS retorna `{ error: null }` com 0 linhas — sem erro visível
  > Referência: `@Gama/02_Projetos/Expertises_Sistema-os/Debug_RLS_Silent_Update.md`

## Auth
- Provider: `AuthProvider` em `src/features/auth/AuthProvider.tsx`
- Hook: `useAuth()` em `src/hooks/useAuth.ts`
- Permissões: `useRole()` em `src/hooks/useRole.ts`
- Nunca acessar `supabase.auth` direto nos componentes — sempre via hooks

## Padrões de CRUD (hooks)
> Referência completa: `@Gama/02_Projetos/Expertises_Sistema-os/Padroes_CRUD_Supabase.md`
- `updated_at: new Date().toISOString()` manual em todo update — Supabase não faz isso automaticamente
- Soft delete com `active: boolean` — nunca DELETE físico em clientes
- Delete + re-insert para coleções (ex: `order_colors`) — mais seguro que upsert com array
- `Promise.allSettled` para reordenamento em lote — não bloquear UI
- Hooks de lista retornam tipo leve; hooks de detalhe retornam tipo completo

## Numeração de OS (order_number)
- Formato em duas fases: seq global na criação → `operator_code + seq` ao entrar em tratamento
- Sequence PostgreSQL `order_number_seq` é a fonte da verdade — nunca calcular seq no frontend para persistir
- `order_seq INT` em `orders` guarda o inteiro puro para reconstrução
- RPC `apply_operator_order_number(p_order_id, p_operator_id)` aplica o prefixo — chamada em `updateStatus` ao ir para `tratamento`
- `operator_code SMALLINT UNIQUE` em `profiles` — definido pelo admin, jamais gerado automaticamente
  > Referência: `@Gama/02_Projetos/Expertises_Sistema-os/Regras_Numeracao_OS.md`

## Edge Functions
- Ficam em `supabase/functions/`
- Usar Deno (TypeScript) — não Node.js
- Secrets via env vars do Supabase Dashboard, nunca hardcoded
