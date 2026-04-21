---
name: nova-feature
description: Cria estrutura completa de uma nova feature seguindo o padrão do Sistema ManOS
argument-hint: <nome-da-feature>
---

# Skill: Nova Feature

Cria a estrutura de uma nova feature em `src/features/<nome>/` seguindo o padrão existente do projeto.

## O que fazer

1. Criar pasta `src/features/<nome>/` com a estrutura:
   ```
   src/features/<nome>/
     <Nome>Page.tsx       # Página principal com layout e título
     components/          # Componentes visuais da feature (criar .gitkeep)
     hooks/               # Hooks de lógica e queries Supabase (criar .gitkeep)
     utils/               # Funções puras, helpers (criar .gitkeep)
   ```

2. `<Nome>Page.tsx` — template mínimo:
   ```tsx
   export function <Nome>Page() {
     return (
       <div className="p-6">
         <h1 className="text-2xl font-bold mb-4"><Título Legível></h1>
       </div>
     )
   }
   ```

3. Adicionar rota em `src/app/Router.tsx`:
   - Importar a Page
   - Adicionar dentro de `<ProtectedRoute>` com path adequado

4. Adicionar item de navegação em `src/app/AppLayout.tsx` (se feature precisa de menu).

## Padrões obrigatórios
- Nome do componente: PascalCase (ex: `CommissionsPage`)
- Nome do arquivo: PascalCase.tsx
- Exportação: named export (não default)
- Rota: kebab-case (ex: `/commissions`)
- Queries Supabase: sempre em hooks, nunca direto na Page
- Tipos: importar de `src/types/database.ts`
