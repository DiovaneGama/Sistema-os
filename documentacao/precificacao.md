# Precificação dos Serviços — Sistema Flexo

> Levantamento realizado em 2026-04-19 com base no código-fonte (`server.cjs`, `server-pedidos-endpoints.cjs`), banco de dados (`database.db`) e backups de pedidos.

---

## 1. Valor por cm²

O preço base de um serviço é definido **por cliente**, não de forma global.

- **Tabela:** `clients` — coluna `val_cm2` (REAL)
- **Valor padrão:** `0.23` R$/cm² (aplicado a novos cadastros)
- **Configurável via:** `POST /api/clients` ou edição do cliente na interface

### Exemplos de valores cadastrados

| Cliente | R$/cm² |
|---|---|
| Etitec | 0.13 |
| Profilme | 0.135 |
| Makpel | 0.15 |
| ZM Plastic | 0.15 |
| Beto Flex | 0.165 |
| Adesiflex | 0.17 |
| Etiflex | 0.18 |
| JP Etiquetas | 0.19 |
| Fixar, BSB Flexo, Kamp, Triunfar, etc. | 0.23 |

> O valor **não varia** por espessura, lineatura ou tipo de serviço — é único por cliente.

---

## 2. Fórmula de Cálculo do Valor Total da OS

```
revenue = (area × val_cm2) + valorMontagem
```

| Variável | Descrição |
|---|---|
| `area` | Área total em cm² informada no formulário da OS |
| `val_cm2` | Valor por cm² do cliente (puxado de `clients.val_cm2`) |
| `valorMontagem` | Valor adicional por fechamento/montagem de arquivo (padrão: 0) |
| `revenue` | Valor total da OS em R$ — armazenado em `os_history.revenue` |

O cálculo é realizado no **frontend** e enviado ao backend, que armazena o valor resultante. O `revenue` é imutável no banco — mesmo que uma OS seja cancelada, o valor histórico é preservado. Na leitura (GET), OSs com status `CANCELADO` retornam `revenue = 0` para fins de relatório, mas o dado original permanece gravado.

---

## 3. Valor de Montagem

- **O que é:** Cobrança adicional aplicada quando o serviço inclui fechamento ou montagem de arquivo pelo operador.
- **Campo:** `valorMontagem` (REAL, default `0`)
- **Quando usar:** Serviços do tipo "Fechamento de Arquivo" ou quando há trabalho adicional de composição.
- **Como funciona:** Somado diretamente ao valor base (`area × val_cm2`).
- **Não há tabela separada** — é apenas um campo do formulário de criação da OS.

---

## 4. Desconto

O desconto é aplicado no nível do **pedido de faturamento**, nunca na OS individual.

### Fórmula do pedido

```
valor_final = subtotal - desconto + frete
```

| Variável | Descrição |
|---|---|
| `subtotal` | Soma dos `revenue` de todas as OSs vinculadas ao pedido |
| `desconto` | Valor em R$ (não percentual) — padrão `0` |
| `frete` | Custo de frete em R$ — padrão `0` |
| `valor_final` | Valor total a cobrar do cliente |

### Regras de desconto

- **Tipo:** Valor fixo em R$ (não existe campo de percentual)
- **Teto:** Não há limite máximo implementado no código
- **Aprovação:** Não há workflow de aprovação — qualquer operador com role `faturamento` pode aplicar desconto livremente
- **Imutabilidade:** Desconto pode ser editado enquanto o pedido não estiver `PAGO` ou `CANCELADO`

---

## 5. Orçamentos e Conversão em OS

> **O sistema não possui módulo de orçamento implementado.**

O fluxo atual é direto: a OS já é criada com o valor final definido. Não há etapa de pré-venda ou aprovação formal antes da criação da OS.

### Fluxo atual

```
1. Operador cria OS (POST /api/os-history)
   → Define cliente, área, tipo de serviço
   → Sistema calcula revenue automaticamente
   → OS nasce com status = TRATAMENTO e status_faturamento = SEM_PEDIDO

2. OS percorre o fluxo de produção
   → TRATAMENTO → MAQUINA → PRONTO → DESPACHADO

3. Operador de faturamento cria pedido (POST /api/pedidos)
   → Seleciona OSs prontas/despachadas
   → Sistema calcula subtotal (Σ revenues)
   → Operador aplica desconto e frete manualmente
   → OSs vinculadas ganham status_faturamento = EM_PEDIDO

4. Registro de pagamento (PATCH /api/pedidos/:id/pagamento)
   → Status do pedido é computado automaticamente
   → Quando PAGO: todas as OSs ganham status_faturamento = FATURADA
```

---

## 6. Comissões

> **Comissões não estão implementadas no código atual.**

Não existe nenhuma lógica de cálculo, tabela, endpoint ou exibição de comissões. O sistema registra qual operador criou e atualizou cada OS, o que fornece a base de dados para uma implementação futura.

### O que o PRD prevê (ainda não implementado)

- Taxa: `1%` do valor final da OS
- Atribuída ao operador que registra a conclusão da etapa
- Estorno: comissão subtraída se a OS retornar como retrabalho por erro de arte
- Visível no dashboard individual do operador

---

## 7. Tabela de Preços por Espessura, Lineatura ou Tipo de Serviço

> **Não existe.** O preço é único por cliente, independente de:

- Espessura da chapa (1.14, 1.70, 2.84 mm)
- Lineatura (60, 85, 133 lpcm, etc.)
- Tipo de serviço (Novo Clichê, Retoque, Cópia, etc.)
- Material/substrato (Metalizado, BOPP, PE, etc.)

A tabela `config_items` armazena apenas as **listas de seleção** (espessuras, tipos de serviço, etc.), sem qualquer precificação associada.

---

## 8. Faturamento

### Status do pedido (computado automaticamente)

```javascript
function computePedidoStatus(valorPago, valorFinal, currentStatus) {
  if (currentStatus === 'CANCELADO') return 'CANCELADO';
  if (valorPago <= 0)               return 'A_RECEBER';
  if (valorPago < valorFinal)       return 'PARCIAL';
  return 'PAGO';
}
```

| Status | Condição |
|---|---|
| `A_RECEBER` | `valor_pago = 0` |
| `PARCIAL` | `0 < valor_pago < valor_final` |
| `PAGO` | `valor_pago >= valor_final` |
| `CANCELADO` | Status explicitamente cancelado (imutável) |

### Cascata ao pagar

Quando o status do pedido passa para `PAGO`, todas as OSs vinculadas recebem `status_faturamento = "FATURADA"` automaticamente (via `applyPedidoStatusToOs()`).

### Separação entre cliente de produção e cliente de faturamento

- OS tem o campo `faturar_para` (pode diferir do cliente de produção)
- Pedido tem `cliente_faturamento_nome` (quem recebe a cobrança)
- Permite faturar para uma empresa diferente da que solicitou o serviço (ex: matriz fatura por filial)

### Número do pedido

- Formato: `PED-DDMMYYYY-N` (ex: `PED-18032026-01`)
- Sequência controlada pela tabela `pedido_sequences`

### Backup automático

- Cada pedido criado/atualizado gera um arquivo JSON em `/Backups/pedidos/{numeroPedido}.json`
- Recuperação via `POST /api/pedidos/recover-from-backup`

---

## 9. Schema das Tabelas Envolvidas

### `clients` (precificação por cliente)
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
name        TEXT UNIQUE NOT NULL
val_cm2     REAL NOT NULL DEFAULT 0.23   -- Valor por cm² deste cliente
```

### `os_history` (valor da OS)
```sql
id                   TEXT PRIMARY KEY
client               TEXT NOT NULL
area                 REAL DEFAULT 0        -- Área em cm²
revenue              REAL DEFAULT 0        -- Valor total calculado
status               TEXT DEFAULT 'TRATAMENTO'
status_faturamento   TEXT DEFAULT 'SEM_PEDIDO'  -- SEM_PEDIDO | EM_PEDIDO | FATURADA
pedido_id            TEXT DEFAULT ''
pedido_numero        TEXT DEFAULT ''
faturar_para         TEXT DEFAULT ''
```

### `pedidos` (faturamento)
```sql
id                        TEXT PRIMARY KEY
numero_pedido             TEXT NOT NULL
cliente_faturamento_nome  TEXT DEFAULT ''
os_ids                    TEXT DEFAULT '[]'    -- JSON array com IDs das OSs
subtotal                  REAL DEFAULT 0       -- Σ revenues das OSs
desconto                  REAL DEFAULT 0       -- Desconto em R$
frete                     REAL DEFAULT 0       -- Frete em R$
valor_final               REAL DEFAULT 0       -- subtotal - desconto + frete
valor_pago                REAL DEFAULT 0
status                    TEXT DEFAULT 'EMITIDO'
condicoes_pagamento       TEXT DEFAULT 'A Vista'
data_vencimento           TEXT DEFAULT ''
nota_fiscal               TEXT DEFAULT ''
```

### `config_items` (listas de seleção — sem precificação)
```sql
id     INTEGER PRIMARY KEY AUTOINCREMENT
type   TEXT NOT NULL    -- espessura | lineatura | serviceType | materiais
value  TEXT NOT NULL
```

---

## 10. Resumo das Regras de Negócio

| Regra | Situação atual |
|---|---|
| Preço base | Por cliente (`val_cm2`), padrão 0.23 R$/cm² |
| Fórmula OS | `revenue = (area × val_cm2) + valorMontagem` |
| Diferenciação por espessura/lineatura | ❌ Não existe |
| Desconto | No pedido, em R$, sem teto, sem aprovação |
| Orçamento formal | ❌ Não implementado |
| Comissão | ❌ Não implementado |
| Revenue preservado no banco | ✅ Sim (auditoria) |
| Cascata de status ao pagar | ✅ Automático |
| Cliente faturamento ≠ cliente produção | ✅ Suportado |
| Backup de pedidos | ✅ Automático em `/Backups/pedidos/` |

---

## 11. Lacunas em relação ao PRD

| Funcionalidade prevista no PRD | Status |
|---|---|
| Orçamento com calculadora de área e validade | ❌ Não implementado |
| Conversão de orçamento em pedido/OS | ❌ Não implementado |
| Teto de desconto com aprovação do gerente | ❌ Não implementado |
| Comissão de 1% por OS ao operador responsável | ❌ Não implementado |
| Estorno de comissão por retrabalho | ❌ Não implementado |
| Tabela de preços por espessura/tipo | ❌ Não previsto (preço único por cliente) |
| Dashboard de comissões por operador | ❌ Não implementado |
