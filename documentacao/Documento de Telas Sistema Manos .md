## **Tela 1: Dashboard Operacional (Página Inicial)**

**Objetivo:** Uma tela "clean" e gamificada, focada em produtividade, recompensas e atalhos rápidos, sem relatórios gerenciais complexos.

**Funcionalidades e Regras de Negócio:**

* **Cálculo de Comissão em Tempo Real:** Atualiza o valor sempre que uma OS avança para a produção (subtraindo estornos de retrabalho).  
* **Gestão de Fila Inteligente:** Oculta pedidos pausados e joga urgências/retrabalhos para o topo da lista.

**Elementos da Interface (UI):**

* **Cabeçalho (Ações Rápidas):** Botões de grande destaque `[📧 Ir para Triagem]` e `[➕ Novo Pedido Manual]`.  
* **Linha de KPIs (Cards superiores):**  
  * *A Minha Comissão:* Valores de "Ganhos Hoje" e "Ganhos no Mês" (com link para a página de Extrato Detalhado).  
  * *O Meu Volume Hoje:* Contador de OSs/cm² finalizados no turno (com barra de progresso se houver meta).  
  * *Termómetro de Qualidade:* Alerta visual (vermelho) de serviços que voltaram por erro de arte.  
* **Área de Trabalho (Fila):** Tabela principal com as demandas ativas e uma aba secundária para "Pausados / Aguardando Cliente".

### **Prompt para Gerar o Wireframe Funcional (Tema Claro: Slate \+ Green Industrial)**

**"Crie um protótipo de wireframe funcional para uma aplicação web responsiva (estilo dashboard SaaS industrial). Obrigatoriamente use um Tema Claro (Light Mode) com uma paleta de cores 'Slate \+ Green Industrial' (utilize tons de cinza 'Slate' do Tailwind para fundos, bordas e textos, combinados com um verde utilitário/esmeralda para botões primários e destaques). Use componentes de UI modernos e limpos (como Tailwind/Shadcn). O layout principal deve ser dividido em duas áreas: um Menu Lateral Fixo (Sidebar) à esquerda e a Área Principal de Conteúdo à direita.**

**1\. Menu Lateral (Sidebar):** Crie um menu lateral com fundo claro (Slate-50 ou Slate-100) e borda direita sutil. No topo, a logo 'Sistema Clicheria' em texto Slate-800 negrito. Adicione os seguintes links de navegação com ícones correspondentes (Lucide icons) em tons de Slate-600:

* \[🏠 Dashboard\]  
* \[📧 Triagem de E-mail\]  
* \[📋 Fila de Pedidos\] (Marque este como o item 'Ativo/Selecionado', dando-lhe um fundo branco, texto Slate-900 e um leve destaque lateral em Verde Industrial)  
* \[👥 Clientes\]  
* \[⚙️ Configurações\] No rodapé do menu lateral, coloque o avatar e o nome do usuário logado ('João \- Arte Finalista') e um ícone de sair (Logout).

**2\. Área Principal \- Estrutura da Tela (A Mesa do Operador):** Fundo da área principal num cinza extra-claro (Slate-50/Branco). Fixe um cabeçalho branco (com sombra leve) contendo: o ID do Pedido em destaque (ex: \#18032026001), um *Badge* com o Status 'Em Tratamento' (fundo Slate-100, texto Slate-700), o Nome do Cliente (com ícone para perfil técnico) e um cronômetro de tempo rodando em tempo real com texto em Verde Industrial (ex: 00:14:32).

**3\. Lógica e Comportamento Funcional do Formulário (React State):** O formulário deve ter campos condicionais:

* Se 'Tipo de Banda' \== 'Larga', exiba um switch/toggle 'Frente e Verso' (Sim/Não).  
* Se 'Tipo de Banda' \== 'Estreita', exiba um input numérico para 'Z da Engrenagem'.  
* Inclua um checkbox global destacado no topo: 'Arquivo já veio montado pelo cliente'. Se marcado, oculte inteiramente o card de 'Layoutização'.

**4\. Componentes Visuais e Dados Fictícios:** Organize o conteúdo em *Cards* brancos com bordas Slate-200. Inputs devem ter um estilo limpo:

* **Card Nomenclatura:** Input 'Nome Original do Arquivo'. Abaixo, 3 caixas de texto *read-only* (com fundo Slate-100) para Nome de Rede, Nome Produção, Identificação Camerom. Preencha com dados fictícios complexos (ex: 18-03-2026\_-\_Etitec\_63lpcm\_Metalizado\_CMYP...), cada uma com um botão fantasma (ghost) 'Copiar' ao lado.  
* **Card Máquina:** Dropdowns para Tipo de Banda (Larga/Estreita), Máquina Alvo, Impressão (Interna/Externa) e Diâmetro do Cilindro.  
* **Card Clichê:** Inputs numéricos para Espessura da Chapa (ex: 1.14, 1.70), Lineatura e Distorção Aplicada (%).  
* **Card Layoutização:** Inputs para Repetições e Carreiras, e um Toggle para 'Item Conjugado'.  
* **Card Cores e Valores:** Dropdown de Qtd de Cores, input numérico 'Jogos de Clichês', e inputs para dimensões (L x A) de cada cor. Adicione um toggle 'Possui Orçamento Prévio?'. Se 'Não', exiba um input de Moeda (R$) para o valor.

**5\. Rodapé Fixo de Ações:** Na parte inferior da tela, uma barra branca com borda superior Slate-200 contendo os botões: secundário '\[Pausar Serviço\]' (texto Slate-600), outline '\[Voltar para a Fila\]', e um botão principal grande '\[✔️ Gerar OS e Enviar para Produção\]' preenchido com o **Verde Industrial** vibrante. Inclua um estado de *loading* (spinner) ao clicar neste botão principal."

---

## **Tela 2: Interface de Triagem de E-mails**

**Objetivo:** Processar rapidamente a caixa de entrada, separando o "lixo" do que é serviço real, gerando rascunhos sem sobrecarregar o servidor.

**Funcionalidades e Regras de Negócio:**

* **Leitura Automática:** O sistema varre o e-mail, identifica o cliente pelo domínio, extrai links e regista a data/hora.  
* **Proteção de Servidor:** Os anexos não são transferidos para o banco de dados nesta fase, ficando retidos no servidor de e-mail até à abertura técnica.  
* **Ação de Saída invisível:** Marcar o e-mail como "lido" na caixa de entrada original (ex: Gmail) após o processamento.

**Elementos da Interface (UI):**

* **Layout *Split-View* (Tela Dividida):** Lado esquerdo com a lista de e-mails não lidos; Lado direito com o corpo do e-mail selecionado.  
* **Barra de Ações (Rodapé do e-mail):** Botões `[🗑️ Descartar/Spam]` e `[📂 Abrir Pedido]`.  
* **Modal de Confirmação:** Ao abrir um pedido, um pop-up com os botões: `[Continuar Abertura Agora]` ou `[Apenas Salvar na Fila Geral]`.

---

## **Tela 3: Criação de Pedido Manual (Balcão / WhatsApp)**

**Objetivo:** Interface rápida para registar demandas que chegam por fora do e-mail, com atalho poderoso para o registo de novos clientes.

**Funcionalidades e Regras de Negócio:**

* **Upload Restrito:** Aceitar apenas o upload de imagens leves (Miniatura/Preview) e o preenchimento de links/caminhos de rede, rejeitando ficheiros pesados (PDF, AI, CDR).

**Elementos da Interface (UI):**

* **Formulário Principal:**  
  * Busca inteligente de Cliente (Auto-completar).  
  * Dropdown de "Canal de Origem" (WhatsApp, Balcão, etc.).  
  * Área de *Drag & Drop* para a Miniatura do Serviço.  
  * Campo de texto para "Caminho do Arquivo na Rede" ou Links externos.  
* **Modal de Novo Cliente (Atalho):**  
  * *Secção Comercial:* Nome, Apelido da Empresa, Unidade/Cidade, Responsável, Contatos, Valor do cm².  
  * *Secção Técnica (Checkboxes):* Substratos, Espessuras de Chapa, Tipos de Tinta.  
* **Rodapé (Ações):** Botões `[Salvar e Voltar para a Fila]` e `[Salvar e Iniciar Tratamento]`.

---

## **Tela 4: Área de Trabalho e Tratamento de Dados (A "Mesa" do Operador)**

**Objetivo:** O formulário técnico dinâmico onde o ficheiro é analisado, os dados de produção são preenchidos e os nomes dos ficheiros são gerados.

**Funcionalidades e Regras de Negócio:**

* **Trava de Concorrência:** Bloqueia a OS para outros operadores assim que a tela é aberta.  
* **Cronómetro de Produção:** Inicia a contagem de tempo automaticamente ao abrir a tela.  
* **Lógica Condicional Dinâmica (Frontend):** Oculta ou exibe campos dependendo das escolhas (Ex: Se Banda Larga \-\> Exibe Frente/Verso; Se Banda Estreita \-\> Exibe Z da Engrenagem).  
* **Motor de Nomenclatura:** Combina os dados do formulário para gerar strings de texto padronizadas.

**Elementos da Interface (UI):**

* **Cabeçalho Fixo:** ID do Pedido em destaque, Nome do Cliente (com ícone de *tooltip* para ver o Perfil Técnico) e Cronómetro a correr em tempo real.  
* **Bloco 1: Ferramenta de Nomenclatura:**  
  * Campo de input: "Nome Original do Ficheiro".  
  * Caixas de texto de saída (com botão "Copiar" ao lado): Nome Padrão de Rede, Nome para Produção Diária e Identificação Camerom.  
* **Bloco 2: Especificações de Máquina:**  
  * Dropdowns: Tipo de Banda, Máquina Alvo, Impressão Interna/Externa.  
  * Campos dinâmicos: Diâmetro, Z da Engrenagem, Frente/Verso.  
* **Bloco 3: Especificações do Clichê:**  
  * Espessura, Distorção, Lineatura.  
* **Bloco 4: Layoutização e Cores:**  
  * Repetições, Carreiras, Item Conjugado (Sim/Não). *(Ocultos no Fluxo B \- Arquivo Montado)*.  
  * Quantidade de Cores, Dimensões de cada cor, Quantidade de Jogos de Clichês.  
  * *Campo Condicional:* Valor do Serviço (aparece apenas se não houver orçamento prévio).  
* **Ação Final (Rodapé):** Botão verde gigante `[✔️ Gerar OS e Enviar para Produção]`.

