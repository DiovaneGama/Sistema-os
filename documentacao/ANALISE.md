# Análise do Projeto Sistema-OS

**Data:** 2026-04-17  
**Autor:** Claude Code (claude-sonnet-4-6)

---

## Visão Geral

**Sistema-OS** é uma aplicação web de gestão de ordens de serviço (OS) voltada para produção de cilindros de impressão e placas (segmento de flexografia/gráfica). O sistema cobre o fluxo completo desde a triagem de e-mails de clientes até o faturamento e despacho, com suporte a múltiplos perfis de usuário e rastreamento de comissões.

---

## Stack Tecnológica

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19.2.4 | Framework principal |
| TypeScript | 6.0.2 | Tipagem estática |
| Vite | 8.0.4 | Build tool + HMR |
| React Router | 7.14.1 | Roteamento SPA |
| Tailwind CSS | 3.4.19 | Estilização |
| Radix UI | — | Componentes acessíveis (diálogos, dropdowns, tooltips) |
| Zustand | 5.0.12 | Gerenciamento de estado global |
| React Hook Form | 7.72.1 | Formulários + validação |
| Zod | 4.3.6 | Validação em tempo de execução |
| Recharts | 3.8.1 | Gráficos e BI |
| dnd-kit | — | Drag & drop (kanban) |
| Lucide React | 1.8.0 | Ícones |

### Backend / Infraestrutura
| Tecnologia | Uso |
|---|---|
| Supabase | PostgreSQL + Auth + Row Level Security (RLS) |

### Dev Tools
- ESLint 9 + typescript-eslint
- PostCSS + Autoprefixer

---

## Arquitetura

O projeto segue **feature-based architecture**, organizando o código por domínio de negócio.

```
src/
├── app/
│   ├── AppLayout.tsx           # Layout principal (sidebar + conteúdo)
│   └── Router.tsx              # Rotas com lazy loading e proteção por role
├── features/
│   ├── auth/                   # Autenticação e controle de sessão
│   ├── clients/                # Gestão de clientes
│   ├── commissions/            # Comissões (placeholder)
│   ├── dashboard/              # Dashboard home + configurações
│   ├── orders/                 # Gestão de ordens de serviço
│   ├── production/             # Visualização e controle de produção
│   ├── quotes/                 # Orçamentos (placeholder)
│   ├── reports/                # Relatórios e BI
│   └── triage/                 # Triagem de e-mails
├── hooks/                      # Custom hooks globais (useAuth, useRole)
├── lib/
│   └── supabase.ts             # Instância do cliente Supabase
└── types/
    └── database.ts             # Tipos TypeScript das entidades do banco
```

---

## Funcionalidades

### 1. Autenticação e Controle de Acesso (RBAC)
- Login via Supabase com sessão persistente e auto-refresh de token
- **7 perfis de usuário:**

| Role | Descrição |
|---|---|
| `sysadmin` | Acesso total ao sistema |
| `admin_master` | Administração geral |
| `gestor_pcp` | Gestão de planejamento e produção |
| `comercial` | Vendas e comissões |
| `arte_finalista` | Fila de arte e tratamento |
| `clicherista` | Fila de produção de clichês |
| `triador` | Triagem de e-mails de entrada |

---

### 2. Triagem de E-mails
- Interface em dois painéis: lista de e-mails + detalhes
- Conversão direta de e-mails em novas OSs
- Gerenciamento de status: `novo`, `em processamento`, `convertido`
- *Atualmente usando dados mockados*

---

### 3. Gestão de Ordens de Serviço (OS)
- Criação com múltiplas origens: e-mail, balcão, WhatsApp, etc.
- Especificações técnicas: tipo de banda, máquina-alvo, diâmetro do cilindro
- Gerenciamento de cores com dimensões e preços
- Suporte a pedidos urgentes e retrabalhos
- **11 estágios de status:**

```
rascunho → fila_arte → tratamento → pausado → fila_produção
→ produção → pronto → faturamento → despachado / devolvido / cancelado
```

---

### 4. Produção
- Visualização em **kanban** (colunas por status) ou **lista**
- Drag & drop para reordenar itens dentro de um status
- Filtros por status, urgência e retrabalhos
- Dashboard HUD com KPIs de produção
- Avanço de status controlado por perfil de usuário

---

### 5. Gestão de Clientes
- Cadastro completo: CNPJ, contatos, cidade
- Especificações por cliente: substâncias, espessuras de placa, tipos de tinta
- Preço por cm²
- Busca e edição em tempo real

---

### 6. Relatórios e BI
- KPIs: volumes, qualidade, retrabalhos, tempo médio de ciclo
- Distribuição de status (gráficos de pizza)
- Volume por dia (gráficos de linha)
- Top clientes (ranking)
- Canais de entrada de pedidos
- Períodos configuráveis: 7 / 30 / 90 dias ou todo o período

---

### 7. Dashboard
- Painel inicial personalizado por perfil de usuário
- Comissão do usuário (para perfil `comercial`)
- Volume do dia vs. meta pessoal
- Retrabalhos e pedidos aguardando retorno do cliente
- Fila de trabalho do dia

---

### 8. Configurações
- Disponível apenas para `sysadmin` e `admin_master`
- Gestão de usuários e configurações do sistema

---

## Modelo de Dados

13 entidades principais definidas em `src/types/database.ts`:

| Entidade | Descrição |
|---|---|
| `Profile` | Dados e perfil do usuário |
| `Client` | Cadastro de clientes |
| `Order` | Ordem de serviço principal |
| `OrderSpec` | Especificações técnicas da OS |
| `OrderColor` | Cores da OS com dimensões e preços |
| `OrderFinancials` | Dados financeiros da OS |
| `Quote` | Orçamento |
| `Commission` | Comissão por OS/vendedor |
| `ScrapRecord` | Registros de refugo |
| `OrderIssue` | Não conformidades / problemas |
| `AuditLog` | Log de auditoria de ações |

---

## Configuração do Ambiente

Requer arquivo `.env.local` com:
```env
VITE_SUPABASE_URL=<url-do-projeto-supabase>
VITE_SUPABASE_ANON_KEY=<chave-anon-do-supabase>
```

Comandos principais:
```bash
npm install       # instalar dependências
npm run dev       # servidor de desenvolvimento (Vite HMR)
npm run build     # build de produção (tsc + Vite)
npm run lint      # verificação ESLint
```

---

## Status do Projeto

| Item | Situação |
|---|---|
| Versão | `0.0.0` — desenvolvimento inicial |
| Git | Repositório inicializado, sem commits |
| Módulo `commissions` | Placeholder (não implementado) |
| Módulo `quotes` | Placeholder (não implementado) |
| Triagem de e-mails | Funcional, dados mockados |
| Banco de dados | Schema definido, depende de configuração Supabase |

---

## Pontos de Atenção

1. **Sem commits git** — histórico de versão não iniciado
2. **Módulos incompletos** — `quotes` e `commissions` são placeholders
3. **Dados mockados na triagem** — precisará integrar com e-mail real (IMAP/API)
4. **Variáveis de ambiente** — `.env.local` não versionado; necessário configurar Supabase
5. **App.tsx** — arquivo raiz ainda contém conteúdo de template Vite (não utilizado)
