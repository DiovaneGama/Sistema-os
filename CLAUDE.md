# Sistema ManOS — Manual de Operação

## Stack
- React 19 + TypeScript 6 + Vite
- Supabase (PostgreSQL + Auth + RLS)
- Tailwind CSS + Radix UI + shadcn/ui
- React Hook Form + Zod (validação)
- Zustand (estado global)
- react-router-dom v7

## Comandos
```
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção
npm run lint      # ESLint
```

## Estrutura de Features
```
src/features/<nome>/
  <Nome>Page.tsx     # página principal
  components/        # componentes da feature
  hooks/             # hooks com lógica de negócio
  utils/             # funções puras
```
Nova feature → sempre criar essa estrutura. Nunca colocar lógica de negócio direto na Page.

## Convenções de Código
- Imports Supabase: usar `supabase` para queries normais, `supabaseAdmin` apenas para criação de usuários (sysadmin)
- Tipos: sempre importar de `src/types/database.ts` — não criar tipos duplicados
- Formulários: usar React Hook Form + Zod + padrão cascata (ver `.claude/rules/forms.md`)
- Componentes UI: usar componentes de `src/components/ui/` (shadcn) — não criar botões/inputs do zero

## RBAC — Papéis do Sistema
| Role | Descrição |
|------|-----------|
| `sysadmin` | Gerencia usuários e permissões |
| `admin_master` | Acesso total operacional |
| `gestor_pcp` | Controla fila e produção |
| `comercial` | Cria orçamentos e pedidos |
| `arte_finalista` | Trata arquivos e gera OS |
| `clicherista` | Executa e despacha produção |
| `triador` | Triagem de e-mails |

Hook: `useRole()` em `src/hooks/useRole.ts` — usar para condicionar UI por permissão.

## Fluxo de Status dos Pedidos
```
rascunho → fila_arte → tratamento → (pausado) → fila_producao
→ producao → pronto → faturamento → despachado
```
Exceções: `devolvido`, `cancelado` (qualquer etapa pré-despacho com permissão gestor+).

## Terminologia do Sistema
- **"Criar OS"** — termo correto para criar novo pedido/ordem de serviço (não "Novo Pedido")
- **OS** = Ordem de Serviço (sinônimo de pedido no domínio da gráfica)
- Botões, títulos de página e labels devem usar "Criar OS", nunca "Novo Pedido"

## Regras Críticas de Negócio
- Pedido em `producao` ou além: campos técnicos são read-only (exige justificativa para editar)
- Status `despachado`: não pode ser reaberto (exceto registrar falha de entrega)
- Comissão: 1% do valor final, atribuída ao operador que conclui sua etapa
- Refugo: obrigatório preencher motivo — gera OS filha `[ID]-A`
- Desconto acima do teto: requer aprovação do gestor

## Commits
Formato: `tipo: descrição em português (≤ 72 chars)`
Tipos: `feat`, `fix`, `chore`, `refactor`, `docs`
