# **📑 PRD \- Sistema ManOS (Versão 2.0)**

## **1\. Visão Geral e Objetivo**

Desenvolver uma plataforma em nuvem focada na gestão e controle de produção para clicherias. O sistema deve centralizar a operação desde a entrada comercial até a expedição, garantindo a visibilidade da fila de produção em tempo real, abertura de pedidos, rastreabilidade das Ordens de Serviço (OS), automação do cálculo de comissões e geração de relatórios gerenciais.

## **2\. Arquitetura e Stack Tecnológico**

* **Abordagem:** Cloud-native, projetado com boas práticas de desenvolvimento ágil (vibe coding) e alta responsividade.  
* **Frontend:** Web App utilizando React \+ TypeScript para garantir uma interface rápida e funcional no chão de fábrica.  
* **Backend e Banco de Dados:** Backend construído sobre Supabase (PostgreSQL, Auth, etc.), simplificando a infraestrutura de nuvem.  
* **Armazenamento de Arquivos Pesados:** O sistema irá extrair links e apontar caminhos para o servidor de arquivos local da empresa, mantendo o banco de dados leve sem realizar o download automático de arquivos pesados.  
* **Processamento Assíncrono:** Utilização de *workers* internos para sincronização da API do Gmail, leitura de links externos e cálculos em segundo plano.

## **3.Personas do Sistema** 

Este documento define os perfis de utilizadores que interagem com o ecossistema, facilitando o mapeamento de funções e permissões.

### **1\. O Triador (Admin / Receção)**

* **Quem é:** Geralmente um assistente administrativo ou técnico de entrada.  
* **Objetivo:** Garantir que nenhum pedido se perca no e-mail e que os arquivos cheguem à produção com rapidez.  
* **Ponto de Dor:** Volume alto de e-mails, dificuldade em encontrar anexos e falta de um número de protocolo (OS) imediato.  
* **Uso do Sistema:** Utiliza a **Tela de Triagem** para converter e-mails em orçamentos/OS. É o guardião da entrada de dados.

### **2\. O Orçamentista (Comercial)**

* **Quem é:** Vendedor técnico ou profissional de atendimento ao cliente.  
* **Objetivo:** Entregar orçamentos precisos rapidamente para fechar a venda.  
* **Ponto de Dor:** Calcular áreas de cm² manualmente, errar o cálculo de "jogos" no cilindro e não saber se o cliente já aprovou o serviço.  
* **Uso do Sistema:** Utiliza a **Tela de Orçamento**. Ele precisa de cálculos automáticos para garantir a margem de lucro e a viabilidade técnica.

### **3\. O Arte-Finalista (Operador de Pré-Impressão)**

* **Quem é:** Designer técnico especializado em flexografia e tratamento de arquivos.  
* **Objetivo:** Ajustar a arte (trap, distorção, separação de cores, etc) para que o clichê imprima corretamente.  
* **Ponto de Dor:** Receber arquivos em formatos errados, falta de especificações de máquina (Cilindro/Z) e falta de histórico de ajustes feitos para o mesmo cliente.  
* **Uso do Sistema:** Interage com o pedido para validar e inserir dados técnicos reais (distorção final, nomes exatos das cores Pantone). Ele é quem "carimba" a viabilidade técnica antes da gravação.  
* Ter a visibilidade e controle das comissões.

### **4\. O Clicherista (Operador de Produção)**

* **Quem é:** Técnico especializado em gravação e processamento químico de fotopolímeros.  
* **Objetivo:** Produzir clichês com qualidade máxima e zero refugo.  
* **Ponto de Dor:** Instruções técnicas erradas vindas da arte, falta de organização na fila e não ter visibilidade da ficha de OS..  
* **Uso do Sistema:** Foca na **Fila de Produção** e na **Ficha de OS**.

### **5\. O Gestor de Produção (PCP)**

* **Quem é:** Responsável por planear e controlar a produção.  
* **Objetivo:** Otimizar o uso das máquinas e reduzir o índice de erros.  
* **Ponto de Dor:** Gargalos na produção, máquinas paradas por falta de arquivo e dificuldade em medir a eficiência de cada operador.  
* **Uso do Sistema:** Monitoriza o **Dashboard** e a **Fila de Produção** em tempo real para remanejar prioridades.

### **6\. O Diretor / Proprietário (Admin Master)**

* **Quem é:** O dono da clicheria ou o gestor financeiro.  
* **Objetivo:** Lucratividade, crescimento e saúde financeira da empresa.  
* **Ponto de Dor:** Falta de relatórios consolidados, incerteza sobre o faturamento real e falta de métricas para investir em novas máquinas.  
* **Uso do Sistema:** Utiliza exclusivamente o **Relatório Master (Business Intelligence)** para ver o ranking de clientes e o faturamento por cm².

#### Mapeamento de Funcionalidades por Persona

| Persona | Triagem | Orçamento | Ficha OS/Pedidos | Comissões | Relatórios |
| ----- | ----- | ----- | ----- | ----- | ----- |
| **Triador** | ⭐⭐⭐ | ⭐ | ⭐ | \- | \- |
| **Orçamentista** | ⭐ | ⭐⭐⭐ | ⭐ | \- | ⭐ |
| **Arte-Finalista** | ⭐ | ⭐ | ⭐⭐⭐ | ⭐ | \- |
| **Clicherista** | \- | \- | ⭐ | \- | \- |
| **Gestor PCP** | ⭐ | ⭐ | ⭐⭐⭐ | ⭐ | ⭐ |
| **Diretor** | \- | \- | \- | ⭐ | ⭐⭐⭐ |

*Legenda: ⭐ (Acesso Básico/Leitura) | ⭐⭐⭐ (Acesso Total/Edição)*

## **4.Permissões de acesso \- Estrutura de RBAC (Role-Based Access Control)**

O ***RBAC*** (Controle de Acesso Baseado em Papéis) é a espinha dorsal da segurança do ManOS. Em vez de dar acesso a cada usuário, definimos permissões para o "Cargo". Isso garante integridade técnica e financeira.

### **4.1. Detalhamento dos Níveis de Acesso**

**Nível: SysAdmin (TI)**

* **Super Admin:** Possui acesso às configurações de infraestrutura.  
* **Gestão de Identidade:** Responsável por criar, editar e desativar contas de usuários (CRUD de Usuários). Somente o SysAdmin vê o botão "Novo Usuário" na tela de Configurações → Usuários.  
* **Redefinição de Senha:** Pode redefinir a senha de qualquer usuário do sistema diretamente em Configurações → Usuários (ícone de chave em cada linha).  
* **Gestão de Segurança:** Pode editar papel (role), meta diária e taxa de comissão de qualquer usuário.

**Nível: Admin Master (Diretor)**

* ## **Poder Total Operacional:** Possui a permissão ALL\_ACCESS. Pode visualizar e editar tabelas de preços, custos de matéria-prima e dashboards financeiros.

* ## **Gestão Humana:** Único que pode ajustar manualmente o saldo de comissões e metas mensais.

**Nível: Gestão / PCP**

* ## **Operacional Master:** Pode reordenar a fila de produção e definir prioridades (Urgente/Normal).

* ## **Controle de Qualidade:** Possui permissão para dar "Baixa por Refugo", documentando perdas.

**Nível: Comercial (Orçamentista)**

* ## **Vendas:** Pode criar e editar orçamentos. Pode aplicar os descontos comerciais necessários de forma autónoma, sem necessidade de aprovação sistémica.

* ## **Visibilidade Limitada:** Não acessa a tela de comissões de terceiros nem custos de insumos (polímero/químicos).

#### **Nível: Técnico (Arte-Finalista)**

* ## **Responsabilidade Técnica:** Possui permissão total para alterar todos os dados do pedido (tanto técnicos quanto comerciais que impactem a produção final, corrigindo eventuais distorções do orçamento original).

* ## **Fluxo:** É o principal responsável pela transição de status do pedido na esteira de pré-impressão: Criar Pedido \> Tratamento \> Produção.

#### **Nível: Operacional (Clicherista)**

* ## **Execução:** Permissão de escrita estritamente para avançar o status da OS nas etapas finais da esteira: Produção \> Pronto \> Despachado.

* ## **Visibilidade:** Acesso focado exclusivamente nas especificações técnicas da OS para garantir a correta gravação do clichê. Não possui acesso a módulos de faturamento, valores ou comissões.

**Matriz de Papéis e Permissões (Planilha Técnica)**

| Funcionalidade | SysAdmin | Admin Master | Gestor PCP | Comercial | Arte-Final | Clicherista | Triador |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| **Criar Usuário** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Editar Papel / Meta / Comissão** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Desativar / Reativar Usuário** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Redefinir Senha de Terceiros** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Alterar Própria Senha** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Editar Papéis e Permissões** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Visualizar Faturamento R$** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Criar Novo Orçamento** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Editar Todos os Dados do Pedido** | ✅ | ✅ | ✅ | ⚠️\* | ✅ | ❌ | ❌ |
| **Alterar Fila de Produção** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Avançar Status (Pedido \> Tratamento \> Produção)** | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Avançar Status (Produção \> Pronto \> Despachado)** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Marcar Refugo (Perda)** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Editar Valor da Comissão** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Ver Própria Comissão** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Ver Comissão de Terceiros** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Acessar BI / Relatórios** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

**Legenda:**

* ✅ **Acesso Total:** Pode visualizar e editar.  
* ❌ **Sem Acesso:** O menu ou botão nem sequer aparece para esta persona.  
* ⚠️ **Acesso Restrito:** Pode visualizar, mas a edição exige validação ou é limitada por campos específicos.  
* \*Comercial pode criar dados, mas o Arte-Finalista tem autonomia para alterá-los caso haja divergência técnica real antes de enviar para a produção.

## **5\. Fluxo de Valor (Workflow Principal)**

1. **Triagem / Atendimento:** Sincronização do Gmail ou entrada comercial (Orçamento/Balcão) \- Geração do Pedido.  
2. **Aprovação de Orçamento**: trata-se da aprovação do orçamento, pelo cliente, caso o orçamento tenha sido cadastrado anteriormente, etapa opcional.  
3. **Pré-Impressão:** Tratamento técnico e Fechamento de Arquivo.  
4. **Aprovação de arte:** Validação pelo gestor e OK final do cliente.  
5. **Produção:** Gravação, Lavagem, Pós-Exposição e acabamento.  
6. **Revisão:** Controle de Qualidade.  
7. **Expedição:** Despacho logístico.

   ## ![][image1]

Detalhamento do fluxo principal:  
![][image2]

## **5\. Cenários Principais de Uso**

### **5.1 Visão Geral da entrada de dados e seus cenários**

O sistema tem **3 portas de entrada** (Triagem de E-mail, Orçamento e Manual), mas todas elas afunilam para um único lugar: a **Fila de Pedidos da Arte Final**. Isso padroniza a fábrica, independentemente de como o cliente pediu o serviço.

### **Cenário 1a: Entrada via Orçamento Aprovado**

**Ator Principal:** O Gestor ou Equipe Comercial 

**Ações e Informações Coletadas:** O cliente aprova um orçamento que já havia sido negociado dias atrás. O Gestor acessa o módulo Comercial do sistema, localiza aquele orçamento específico e clica no botão **"Gerar Pedido"**. Nessa tela de conversão, o sistema já traz tudo pré-preenchido do orçamento:

* **Dados do Cliente** e prazos negociados.  
* **Valores e Condições de Pagamento** (o que vai travar o campo de "valor" lá na frente para o Arte Finalista, garantindo que o valor cobrado seja o valor aprovado).  
* A única ação manual do Gestor nesta etapa é salvar o caminho da pasta (ou colar o link do Drive/WeTransfer) que o cliente enviou validando a produção, e inserir alguma observação técnica se necessário.   
  **Resultado / Próxima Fase:** O sistema gera o **ID único do Pedido** (ex: 16032026002), vincula o número do Orçamento a ele, e lança esse card diretamente na **Fila de Pedidos da Arte Final**, pulando totalmente a etapa de Triagem. O Arte Finalista assume a partir daqui para tratar o arquivo.

### **Cenário 1b: Entrada Manual (Balcão / WhatsApp / Telefone)**

**Ator Principal:** O Atendimento ou Recepcionista 

**Ações e Informações Coletadas:** Um cliente chega no balcão com um pen drive, ou manda uma mensagem rápida no WhatsApp da empresa com um arquivo em anexo pedindo *"roda isso pra mim pra amanhã"*. O Atendimento clica no botão principal **"Novo Pedido"**. O sistema abre um formulário em branco onde o atendente precisa construir o pacote de dados da tela criar pedido do zero.

* **Seleção do Cliente:** Busca o cliente no banco de dados (ou faz um cadastro rápido).  
* **Anexos:** Faz o upload do arquivo salvo do WhatsApp Web ou do pen drive.  
* **Canal de Origem:** Marca de onde veio a demanda (Menu suspenso: *WhatsApp, Balcão, Telefone*).  
* **Briefing Rápido:** Um campo de texto para digitar o que o cliente pediu (ex: *"Cliente pediu pra usar a mesma chapa do mês passado, mas mudar a cor do logo para azul"*).   
  **Resultado / Próxima Fase:** Assim como no cenário anterior, o sistema gera o **ID único do Pedido** com data e hora atuais, e joga o card direto para a **Fila de Pedidos da Arte Final**. Quando o Arte Finalista abrir, ele verá de onde veio (WhatsApp) e lerá as instruções do atendente antes de começar a padronização e o tratamento técnico.

**Cenário 01c: Triagem Inteligente e Abertura Inicial de Pedido (via E-mail)**

**Atores Principais:** Operador de Triagem ou Arte Finalista 

**Ações e Informações Coletadas:** O Operador visualiza a interface em tela dividida (*split-view*) com a fila de e-mails recebidos. Ele clica em uma mensagem e o sistema exibe o corpo do texto ao lado. Após a leitura, ele toma uma decisão:

* Se não for uma demanda (spam, dúvida simples), ele clica em **"Descartar"**, limpando o item da tela.  
* Se for um serviço, ele clica em **"Abrir Pedido"**. Na tela de criação de pedido que se abre, ele revisa os dados que o sistema já capturou e preencheu automaticamente nos campos:  
  * **Nome do cliente:** Apelido do Cliente (identificado pelo domínio/remetente do e-mail);  
  * **Data e hora:** Momento exato em que o e-mail chegou;  
  * **Arquivos em anexo:** O sistema deverá armazenar os anexos do e-mail somente para o primeiro download, que deverá ser feito posteriormente na etapa definitiva de Criar Pedido (evitando sobrecarga no servidor);  
  * **Links para download:** (WeTransfer, Google Drive, etc.) extraídos do texto da mensagem.

O Operador confere esses dados preliminares e preenche informações complementares do serviço (se necessário).

**Resultado / Próxima Fase:** O sistema gera o pedido e pergunta qual ação o operador deseja tomar:

1. **Continuar com a Abertura:** O operador assume o pedido naquele momento e avança para a tela de preenchimento técnico(abre a tela criar pedido com os dados preenchidos).  
2. **Apenas Salvar:** O operador clica em "Salvar". O pedido recém-criado é então movido para a **Fila de Pedidos** geral, ficando disponível para que *qualquer* outro operador (ou Arte Finalista) possa assumi-lo e continuar a abertura do pedido posteriormente.

Independentemente da escolha, simultaneamente e de forma invisível, o sistema envia um comando para o servidor de e-mail marcando aquela mensagem original como "lida", removendo-a da tela de triagem.

### **Cenário 02:** Criação, Envio e Aprovação de Orçamento

 **Ator Principal:** Equipe Comercial ou Gestor 

**Ações e Informações Coletadas:** O cliente entra em contato (por e-mail, telefone ou WhatsApp) solicitando um preço antes de enviar a arte final, ou envia um rascunho apenas para cotação. O Gestor acessa o módulo de **Orçamentos** e clica em **"Novo Orçamento"**.

Nesta tela, ele preenche os dados preliminares para precificar o serviço:

* **Cliente:** Seleciona no banco de dados.  
* **Especificações Estimadas:** Insere a previsão técnica (ex: estimativa de área total/cm², quantidade provável de cores, tipo e espessura da chapa).  
* **Valores:** O sistema calcula o valor baseado nos cm² ou o Gestor insere o valor negociado manualmente (incluindo possíveis taxas de montagem ou frete).  
* **Validade:** Define até quando aquele preço é válido (ex: 15 dias).

Com os dados preenchidos, ele clica em **"Gerar Proposta"**. O sistema cria um PDF e uma mensagem de texto para o Whapp para o Gestor enviar ao cliente. O card desse orçamento fica estacionado em uma fila com o status **"Aguardando Aprovação"**.

Dias depois, o cliente responde com um "Ok, pode fazer". O Gestor localiza aquele orçamento na tela e clica no botão **"Aprovar Orçamento"**. 

**Resultado / Próxima Fase:** O status do orçamento muda instantaneamente para **"Aprovado"**. Ele agora deixa de ser apenas uma estimativa de preço e se torna um registro financeiro validado, liberando no sistema o botão de **"Converter em Pedido"** (que leva exatamente para aquele fluxo de Entrada que mapeamos anteriormente, jogando a demanda para a Arte Final).

### **Cenário 03: Captura de Pedido, Padronização de Arquivos e Tratamento de Dados**

**Ator Principal:** O Operador / Arte Finalista

**Ações e Informações Coletadas:** O operador pode chegar a esta etapa a partir de duas origens diferentes:

1. **Direto da Triagem:** Ele acabou de triar um e-mail e clicou no botão para continuar com a abertura técnica do pedido imediatamente.  
2. **Pela Fila de Pedidos:** Ele acessa a Fila Geral, seleciona a demanda mais antiga (um rascunho salvo) e clica em "Abrir Pedido".

Neste exato momento, o sistema executa três ações automáticas: gera um ID único de Pedido baseado na data e sequência (ex: 18032026001), altera o status para "Tratamento" (travando o pedido para este operador e tirando da visão dos demais) e inicia o cronômetro de tempo de produção.

A partir daqui, o trabalho segue uma ordem lógica em três passos:

**Passo 1: Download e Nomenclatura Padrão de Rede** Antes de inserir os dados técnicos, o operador precisa organizar o arquivo. Ele faz o download do anexo original e utiliza a Ferramenta de Nomenclatura digitando ou colando o nome original do arquivo (Nome do Serviço, ex: *Alimentos\_Oliveira*). Com isso, o sistema gera o primeiro padrão:

* **Nome do Arquivo Padrão (Rede da Empresa):** \* Regra: `[Data]_[Nome_do_serviço]`  
  * Exemplo: `18-03-2026_Alimentos_Oliveira` O operador copia esse nome, renomeia o arquivo baixado e o salva na pasta correta do servidor.

**Passo 2: Tratamento de Dados Técnicos** Com o arquivo aberto e analisado, o operador preenche os dados técnicos no sistema.

* **Fluxo A (Serviço para Montagem/Fechamento):** O operador insere:  
  * **Upload:** Miniatura do serviço (preview).  
  * **Especificações de Máquina:** Tipo de banda (Larga/Estreita) – *com lógicas condicionais: se for **Banda Larga**, deve-se indicar se a arte será impressão Frente e Verso (sim/não); se for **Banda Estreita**, deve-se informar o **Z da engrenagem*** –, Máquina alvo (opcional), Tipo de impressão (Interna/Externa) e Diâmetro do cilindro.  
  * **Especificações de Clichê:** Espessura da chapa (ex: 1.70, 1.14 ou 2.84), Distorção aplicada e Lineatura.  
  * **Layoutização:** Número de repetições, Número de carreiras e a indicação se o serviço terá Item Conjugado (sim/não).  
  * **Cores e Valores:** Quantidade de cores utilizadas e a **Quantidade de jogos de clichês** (podendo ser um número geral de jogos vinculado ao total de cores ou a especificação de jogos extras para uma determinada cor isolada). Se o sistema não identificar um orçamento prévio e aprovado vinculado, o operador insere manualmente os valores de cada cor e o valor do fechamento/montagem.  
* **Fluxo B (Serviço Já Montado \- Exceção):** Se o cliente enviou o arquivo pronto para gravação, o operador preenche normalmente as *Especificações de Máquina* e as *Especificações de Clichê*, mas **pula a etapa de Layoutização** (repetições, carreiras e item conjugado). Em seguida, insere os dados de cores, a quantidade de jogos (geral ou por cor) e os tamanhos (dimensões) de cada cor.

**Passo 3: Nomenclatura de Produção e Camerom** Agora que o sistema possui todos os dados técnicos e o perfil do cliente (Substrato, Cores, Espessura), a Ferramenta de Nomenclatura gera as duas saídas finais:

* **Nome do Arquivo para Clichês do Dia (Produção Diária):** \* Regra: `[Data]_-_[Apelido_do_cliente]_[Lineatura]_[Substrato]_[Espessura_da_chapa]_[Cores_abreviadas]_[Nome_do_serviço]_[Nome_do_operador]`  
  * Exemplo: `18-03-2026_-_Etitec_63lpcm_Metalizado_1.14_CMYP_Alimentos_Oliveira_Joao`  
* **Nomenclatura do Camerom:** Identificação em texto que será incluída visualmente no camerom da arte (caso o serviço possua camerom).  
  * Regra: `[Apelido_do_cliente]/data:[Data]/Cliche_[Espessura_da_chapa]/[Quantidade_de_cores] Cores/[Nome_do_serviço]/[Descricao_das_cores]`  
  * Exemplo: `Etitec/data:18-03-2026/Cliche_1.70/2 Cores/Alimentos Oliveira/Magenta Amarelo`

**Resultado / Próxima Fase:** Todos os dados técnicos, financeiros e de nomenclatura ficam permanentemente atrelados ao ID gerado inicialmente. O cronômetro de tratamento é finalizado/registrado. O operador clica em "Gerar OS" para imprimir/exportar a ficha técnica. Feito isso, o card do pedido é liberado e movido para a Fila de Produção.

**Ajustes de Arquitetura para este cenário:**

* **Trava de Concorrência:** Quando o Arte Finalista clica em "Abrir pedido", o sistema precisa bloquear esse pedido para os demais quase em tempo real, para evitar duplicidade.  
* **Campos Condicionais no Frontend:** O sistema precisará exibir ou ocultar campos dinamicamente:  
  * `IF tem_orcamento == false THEN exibe_campos_de_valor`.  
  * `IF banda == 'Larga' THEN exibe_pergunta_frente_e_verso`.  
  * `IF banda == 'Estreita' THEN exibe_campo_Z_engrenagem`.


**Cenário 04:** Fila de Produção e Conclusão de Clichê 

**Ator Principal:** O Operador de Produção (Clicherista) 

**Ações e Informações Coletadas:** O pedido, recém-liberado pelo Arte Finalista, vai para a **Fila de Produção**. Na vida real, a chapa está passando por todo o do processo flexográfico (gravação, processamento, acabamento), mas no sistema, o card do pedido permanece aguardando nesta fila, servindo como um painel de controle das tarefas do dia para o setor.

Quando o processo físico chega ao fim e o clichê está cortado e pronto, o Clicherista vai até o sistema e localiza o pedido na fila (seja buscando pelo ID da OS, pelo nome do cliente, ou olhando o topo da lista). Ele clica no botão **"Finalizar Produção"** (ou "Marcar como Pronto"). Como a etapa é focada no resultado, o sistema exige o mínimo de atrito: apenas um clique de confirmação na tela perguntando se o serviço foi concluído com sucesso. 

**Resultado / Próxima Fase:** O sistema atua nos bastidores registrando a data e a hora exatas daquele clique. Isso encerra o cronômetro de tempo de produção do pedido (permitindo que, no futuro, você tire relatórios de quanto tempo sua fábrica leva para rodar um serviço). O card do pedido desaparece da fila de pronto e é movido para a etapa seguinte de Expedição.

**Cenário 05:** Faturamento, Geração de Romaneio e Despacho 

**Atores Principais:** O Gestor (Administrativo) e o Operador Clicherista (Expedição) 

**Ações e Informações Coletadas:** Assim que a produção é finalizada, o pedido entra simultaneamente na visão do Gestor e na do Operador, mas com papéis diferentes:

* **Ação do Gestor (Faturamento):** O Gestor acessa a **Fila de Faturamento**. Ele visualiza os pedidos concluídos e agrupa as OSs de um mesmo cliente que estão prontas para envio. No sistema, ele confirma os valores, emite a cobrança e clica em **"Gerar Romaneio de Entrega"**. O sistema compila essas OSs em um único documento e o envia direto para a impressora do setor de expedição.  
* **Ação do Operador Clicherista (Despacho):** Com o Romaneio impresso em mãos, o operador utiliza a lista para conferir fisicamente as chapas finalizadas. Ele embala os clichês de acordo com o documento, anexa o Romaneio à embalagem. Após entregar a caixa para a transportadora, motoboy ou cliente (balcão), ele volta ao sistema, localiza aquele Romaneio/Pedido e altera o status final clicando em **"Despachado"**.

**Resultado / Próxima Fase:** O sistema registra a data e a hora exatas do despacho, fechando o ciclo de vida operacional daquelas OSs (o status final passa a ser "Entregue"). Os dados financeiros gerados pelo Gestor alimentam o módulo de faturamento.

## **6\. Cenários Alternativos de Uso**

**Cenário Alternativo 01:** Fluxo Alternativo na Triagem: Anexo Ausente ou Link Expirado.

**Ator Principal:** O Operador de Triagem 

**Ações e Informações Coletadas:** O Operador clica no e-mail na fila da interface *split-view*. Ao ler a mensagem e tentar capturar os ativos, ele se depara com um problema: não há anexo ou o link extraído (WeTransfer/Drive) está expirado/sem permissão de acesso.

Como não é possível iniciar o serviço, em vez de clicar em "Abrir Pedido" ou "Descartar", o operador clica em um terceiro botão: **"Sinalizar Pendência"**.

Nesse momento, o sistema abre uma pequena janela (modal) solicitando os seguintes dados:

* **Motivo da Pendência:** Um campo de seleção rápida (Dropdown com opções como: *Link Expirado, Sem Anexo, Sem Permissão no Drive, Arquivo Corrompido*).  
* **Ação de Comunicação:** O sistema oferece um botão com a opção **"Solicitar reenvio ao cliente"**. Se marcado, o sistema gera e envia automaticamente uma resposta de e-mail padronizada para o cliente (ex: *"Olá, recebemos seu e-mail, mas o link expirou ou está sem anexo. Por favor, reenviar?"*).

**Resultado / Próxima Fase:** O sistema **não** gera um ID de Pedido oficial para a produção. Aquele e-mail ganha o status de **"Pendente \- Aguardando Cliente"** e é movido para uma área separada na própria tela de Triagem (para não poluir a fila de novas demandas). No Gmail, o sistema pode aplicar uma etiqueta de "Pendência". O card ficará estacionado nessa área de espera até que o cliente responda ao e-mail com o novo link, momento em que o card volta a piscar como "Nova Mensagem" para o operador retomar o fluxo normal.

**Cenário 02 :** Fluxo Alternativo na Arte Final: Problemas de Arquivo ou Dados Incompletos 

**Ator Principal:** O Operador / Arte Finalista 

**Ações e Informações Coletadas:** O Arte Finalista abre o pedido na sua fila e começa a analisar os ativos enviados. Durante a conferência, ele identifica um impeditivo crítico que impossibilita a continuidade do fluxo. Pode ser um arquivo fora das especificações (fontes ausentes, baixa resolução, sem sangria) ou a falta de um dado vital (ex: cliente não informou o Z da engrenagem ou a espessura da chapa).

Como ele não pode prosseguir com o tratamento, ele clica no botão **"Pausar Pedido/Reportar problema"**. O sistema abre uma janela solicitando os seguintes dados de bloqueio:

* **Categoria do Problema:** (Menu suspenso com opções padronizadas: *Erro de Arquivo, Faltam Informações Técnicas, Dúvida de Montagem*).  
* **Descrição Detalhada:** Um campo de texto livre onde o operador descreve exatamente o que impede o avanço (ex: *"Arquivo veio em RGB e sem as fontes em curvas"*).  
* **Responsável pela Resolução:** Quem precisa destravar isso? (Opções: *Cobrar o Cliente* ou *Acionar o Supervisor)*.  
* **Evidência (Opcional):** Um campo de upload rápido para o operador anexar um print de tela (screenshot) mostrando o erro no software de edição.

**Resultado / Próxima Fase:** O sistema **pausa imediatamente o cronômetro de produção** daquele pedido. Isso é fundamental para não arruinar as métricas de produtividade do operador por um erro que não é dele. O status do pedido muda para **"Pausado \- Pendência de Arte"**.

O card sai da visão principal de trabalho do Arte Finalista e é movido para um painel de "Pedidos Retidos". Dependendo da regra definida, o sistema notifica o supervisor para fazer a ponte. O pedido fica "congelado" até que a informação chegue. Quando o comercial ou o cliente resolvem a pendência, o status volta para "Tratamento", o card retorna para a fila do operador original e o cronômetro volta a rodar.

###  **O Grande Benefício Deste Fluxo**

Ao documentar o motivo da pausa e parar o relógio, você ganha dados valiosíssimos de gestão. No fim do mês, você poderá tirar um relatório e descobrir: *"Perdemos X horas de produção apenas esperando clientes aprovarem arquivos ou mandarem fontes"*. Isso ajuda a melhorar o seu processo de atendimento lá na ponta.

**Cenário 03:** Fluxo de Exceção na Produção: Refugo, Falha de Processo e Retrabalho 

**Ator Principal:** O Operador de Produção (Clicherista) 

**Ações e Informações Coletadas:** O Clicherista está processando a chapa na linha de produção. Durante uma das etapas físicas (gravação a laser, exposição, lavagem ou secagem), ocorre um problema irreversível: a chapa sofre danos, o relevo não sustenta, há uma queda de energia no meio da gravação ou um erro de manuseio. A chapa foi perdida.

Em vez de clicar no botão de "Finalizar Produção", o operador localiza o pedido na sua tela e clica no botão **"Sinalizar Perda / Solicitar Retrabalho"**. O sistema abre um formulário focado em capturar os dados daquele prejuízo para o estoque e para a qualidade:

* **Motivo do Refugo:** (Menu suspenso com opções como: *Falha na Lavagem, Queda de Energia, Erro de Máquina (Laser), Bolha no Polímero, Erro de Manuseio, Erro arquivo*).  
* **Etapa da Falha:** Em qual máquina/momento o erro ocorreu? (Para identificar se uma máquina específica está falhando mais que as outras).  
* **Dimensões Perdidas (Opcional, mas recomendado):** Qual o tamanho do pedaço de chapa que foi para o lixo? (Para o sistema calcular o custo financeiro do desperdício).  
* **Ação Necessária:** O operador define se o arquivo precisa voltar para o Arte Finalista corrigir algo na tela (ex: *Ajustar curva de gravação*), ou se ele só precisa de autorização para cortar um novo pedaço de chapa e gravar o mesmo arquivo de novo.

**Resultado / Próxima Fase:** O sistema executa várias ações simultâneas. Primeiro, ele registra no banco de dados o desperdício (refugo) atrelado àquele ID de pedido para os relatórios gerenciais. Em seguida, ele gera uma **"OS de Retrabalho"** (uma OS filha, ex: 16032026001-A), para não misturar o tempo e o custo da primeira tentativa com a segunda. Se for um erro de arquivo, o pedido volta para a fila do Arte Finalista com a tag **"Urgente \- Retrabalho"**. Se for apenas erro físico, o pedido volta para o topo da Fila de Produção, alertando o gestor sobre a perda do material, e o Clicherista recomeça o processo físico.

### **O Valor Desse Mapeamento**

Muitas empresas falham em medir o retrabalho. O operador simplesmente joga a chapa ruim no lixo, corta uma nova e o dono nunca fica sabendo que gastou o dobro de matéria-prima naquele pedido. Esse cenário amarra o furo no estoque e responsabiliza o processo.

**Cenário 04:** Fluxo de Exceção na Expedição: Falha na Entrega ou Devolução de Romaneio 

**Ator Principal:** O Operador de Expedição ou Gestor Administrativo 

**Ações e Informações Coletadas:** O material foi faturado e o status do pedido estava como "Despachado". Porém, o motoboy ou a transportadora retorna à clicheria com a caixa, ou avisa via sistema/telefone que a entrega não pôde ser concluída.

O Operador acessa a aba de pedidos despachados, localiza aquele Romaneio/ID específico e clica no botão **"Registrar Falha de Entrega"** (ou "Sinalizar Devolução"). O sistema então abre um formulário curto para registrar o que deu errado:

* **Motivo da Devolução:** Um menu suspenso para padronizar o problema (Ex: *Cliente Ausente, Endereço Incorreto/Mudou, Recusado pelo Cliente, Extravio/Acidente da Transportadora*).  
* **Custo Extra de Frete (Opcional):** Um campo de valor numérico. Se o motoboy cobrou a viagem perdida, o sistema precisa registrar essa despesa extra atrelada ao pedido.  
* **Detalhes da Ocorrência:** Campo de texto livre para o operador explicar a situação (ex: *"Portaria informou que a empresa está de recesso até segunda-feira"*).

**Resultado / Próxima Fase:** O sistema altera o status daquele Romaneio de "Despachado" para **"Devolvido / Pendente de Reenvio"**. O pacote físico é colocado em uma prateleira de espera. Imediatamente, o sistema dispara um alerta (visual ) para a equipe Comercial/Atendimento, informando que eles precisam entrar em contato com o cliente para alinhar um novo envio ou corrigir o endereço. Quando o alinhamento é feito, o Gestor libera o pacote novamente para a Expedição, gerando uma nova tentativa de despacho sem alterar os dados originais de produção ou faturamento.

**Cenário 05:** Fluxo Alternativo no Orçamento: Reprovação, Revisão ou Vencimento

**Ator Principal:** Equipe Comercial ou Gestor 

**Ações e Informações Coletadas:** O Gestor enviou o orçamento e ele está na fila de "Aguardando Aprovação". A partir da resposta (ou falta de resposta) do cliente, o fluxo toma um rumo diferente do esperado:

* **Situação A (Reprovação Direta):** O cliente responde dizendo que fechou com a concorrência ou que o projeto foi cancelado. O Gestor acessa o orçamento e clica em **"Reprovar / Perdido"**. O sistema exige o preenchimento de um dado crucial:  
  * *Motivo da Perda:* Menu suspenso (Ex: *Preço Alto, Prazo de Entrega, Fechou com Concorrente, Projeto Cancelado*).  
  * *Observação:* Campo de texto livre para detalhes.  
* **Situação B (Renegociação/Revisão):** O cliente acha caro e pede um desconto, ou decide diminuir o tamanho da arte para baratear. O Gestor clica em **"Revisar Orçamento"**. O sistema não apaga o original; ele cria uma **nova versão** (ex: de *ORC-001* passa para *ORC-001-Rev02*), permitindo que o Gestor altere os valores ou metragens sem perder o histórico do que foi ofertado inicialmente.  
* **Situação C (Vencimento Automático):** O cliente não responde nada. Quando o prazo de validade definido (ex: 15 dias) é atingido, o próprio sistema (via automação invisível) muda o status do orçamento para **"Vencido"**.

**Resultado / Próxima Fase:** Se o orçamento for Reprovado ou Vencido, o sistema encerra o ciclo. O card ganha o status de "Perdido/Arquivado" e **não** gera um Pedido de Produção. O grande ganho aqui é que esses dados alimentam um painel de indicadores (Dashboard Comercial) onde você, como dono, poderá ver no fim do mês: *"Perdemos R$ 10.000 em orçamentos este mês, sendo 80% deles pelo motivo 'Preço Alto'"*. Se o orçamento for Revisado, a nova versão volta para o status "Aguardando Aprovação", reiniciando o relógio até o cliente dar o "Ok" final

## **7\. Telas e Funcionalidades Principais (MVP)**

### **7.1. Triagem Inteligente (Gmail API)**

* **Interface Split-view:** Lista de e-mails à esquerda e detalhamento (corpo do e-mail) à direita para navegação rápida.  
* **Sincronização:** Automática via cron job ou manual por botão destacado.  
* **Captura de Ativos:** Extração visual de links de plataformas externas (como WeTransfer e Google Drive) para acesso com um clique.  
* **Ações:** Opção de "Descartar" (limpando a fila) ou "Abrir pedido", que direciona o usuário para a criação do pedido, preenchendo automaticamente nome do cliente, data e hora de chegada do email e links.  
* **Gestão de Status:** O e-mail é marcado como "lido" no Gmail após a abertura do pedido.

### **7.2. Comercial: Gestão de Pedidos**

* **Visão Geral:** Tabela centralizadora de demandas (lista de pedidos gerados), originadas do e-mail, do módulo de orçamento ou de cadastro manual (telefone/balcão/whatsapp).  
* **Criação e Detalhamento:** Permite anexar arquivos via link local, atribuir clientes, visualizar o valor do serviço e clicar em um atalho para a Ficha de OS vinculada (contendo todas as informações técnicas sobre o serviço), centralizando o fluxo de atendimento.

### **7.3. Comercial: Orçamento**

* **Calculadora em Tempo Real:** Tela técnica onde o orçamentista insere o número de cores, largura e altura da chapa, se haverá cobrança de fechamento de arquivo/montagem ou não, se sim, qual será o valor. O sistema calcula imediatamente a área total em cm² , o de cada cor e o valor final.  
* **Automação:** Ao clicar em "Aprovar e Abrir Pedido", o sistema transforma automaticamente o orçamento em um Pedido e em uma Ordem de Serviço (OS) na fila de produção.

### **7.4. Pré-Impressão: Fechamento de Arquivo**

* **Especificações (Tech Spec):** O Arte-finalista poderá inserir/alterar as seguintes informações caso não tenham sido preenchidas na abertura do pedido como: Tipo de banda, Máquina alvo,tipo de impressão (interna ou externa), espessura do chapa, distorção aplicada, cilindro, Z da engrenagem, lineatura , número de repetições, número de carreiras, cores utilizadas e inserir valores das cores caso não exista um orçamento prévio cadastrado e aprovado, assim como valor de fechamento/montagem.  
* **Versionamento:** Cadastro das versões da arte (V1, V2, etc.) com atalhos para os arquivos finais.

### **7.5. Operação e PCP: Fila de Produção**

* **Painel de Decisão Rápida:** Visualização em lista limitada a um horizonte produtivo de no máximo 72 horas(podendo ser reduzida ou aumentada conforme filtro aplicado), contendo filtros robustos por Status, Tempo em fila, Operador, Máquina e Cliente.  
* **Head-Up Display:** Cards no topo mostrando quantidade de OSs na fila, carga atual em produção (tempo médio em fila, tempo mínimo e tempo máximo), atrasos e refugos.  
* **Gestão Drag & Drop:** Movimentação visual de Pedidos apenas para definir prioridades dentro de uma mesma etapa.  
* **Apontamento Contínuo:** O tempo de produção é contabilizado de maneira corrida (24/7) através do registro (timestamp) de mudança de status (Aguardando \- Produzindo \- Finalizado \- Despachado), eliminando a necessidade de um botão "Pausar". Ao finalizar, informa-se a quantidade boa ou refugo.

### **7.6. Detalhamento: Visualizado de OS**

**Identidade do Serviço:** Centraliza o "DNA técnico"(Tipo de banda, Máquina alvo,tipo de impressão (interna ou externa), espessura do chapa, distorção aplicada, cilindro, Z da engrenagem, lineatura , número de repetições, número de carreiras, cores utilizadas e se houve fechamento/montagem realizado.)

**Trilha de Auditoria:** Linha do tempo completa informando quem realizou cada mudança de etapa ou apontamento e quando ocorreu.

### **7.7. Performance: Comissões e Dashboards**

* **Operador:** Painel individual exibindo total de cm² produzidos, comissão financeira gerada, índice de refugo próprio e meta por período.  
* **Gestão:** Painel com KPIs estratégicos como Lead Time médio, taxa de ociosidade (OS parada \> 24h), ranking de gargalos e índice de refugo.


## **8\. Regras de Negócio Críticas**

* **Congelamento da Ficha Técnica:** Assim que o pedido entra em produção, os dados técnicos ficam protegidos como "somente leitura", impedindo edições acidentais, caso haja a necessidade de alterações, o operador deverá justificar o motivo e o sistema deverá registrar esses dados em log.  
* **Bloqueio Post-Mortem:** Pedido com status "Despachado" não pode ser reaberto ou alterado sob nenhuma circunstância (exceto caso ocorra algum problema com a entrega da remessa, o usuário clicherista deverá relatar o problema ocorrido no sitema).  
* **Segregação Anti-Fraude:** O operador não possui permissão para modificar o cálculo da comissão ou aprovar a própria comissão.  
* **Regra de Refugo e Custo Zero:** É obrigatório o preenchimento de um motivo ao registrar um refugo interno. A reabertura da OS para correção entra com reposição de R$ 0,00 para o cliente.  
* **Teto de Desconto:** Orçamentos que ultrapassem o limite percentual de desconto exigem liberação do Gerente.  
* **Comissionamento por Etapa:** A comissão é fixada em um valor de 1% do valor final do pedido é atribuída automaticamente ao operador que registra a conclusão de sua respectiva etapa.  
* **Checklist de Expedição:** O despacho do Pedido só é habilitado após a checagem manual de qualidade (ex: Dados da arte, separação e quantidade de cores conferidas, Pontos de mínima conferidos, cameron, dados do serviços registrados na chapa, micropontos em serviços banda larga) na tela de expedição/despache.

## **9\. Indicadores de Sucesso (KPIs)**

### **9.1Lead Time Total e por Etapa (Velocidade)**

* **O que o gráfico mostra:** O tempo exato que um pedido leva desde o clique no botão "Aprovar Orçamento" ou "Abrir Pedido na Triagem" até o clique em "Despachado".  
* **Como o sistema calcula:**  
  * **Lead Time Total:** Data/Hora do Despacho \- Data/Hora de Criação do Pedido.  
  * **Tempo em Arte Final:** Fim do Tratamento \- Início do Tratamento (descontando o tempo que o cronômetro ficou pausado em "Pendência de Arte").  
  * **Tempo em Produção:** Fim da Produção \- Início da Fila de Produção  
* **Visão no Dashboard :** Um **gráfico de barras** (horizontais). Cada barra representa uma etapa do processo (Fila da Arte Final, Tratamento, Fila de Produção, Produção, Expedição). O tamanho da barra indica o tempo médio em horas/minutos gasto naquela etapa. Isso permite que você veja imediatamente qual barra está "esticando" mais do que deveria e segurando o fluxo da fábrica

  ### **9.2. Throughput (Volume de Entrega em cm²)**

* **O que o gráfico mostra:** O volume real de clichês que a empresa está conseguindo entregar, independentemente da quantidade de pedidos.  
* **Como o sistema calcula:** Soma da "Área Total (cm²)" de todos os pedidos que atingiram o status "Despachado" dentro de um período (dia/semana/mês).  
* **Visão no Dashboard:** Um gráfico de linhas focado na área total entregue, com um **seletor rápido de período (Dia / Semana / Mês)** no topo do painel.  
  * **Visão Dia:** Para medir o ritmo exato do turno atual e fechar o dia sabendo se a meta diária foi batida.  
* **Visão Semana:** Excelente para avaliar a constância da equipe e planejar a necessidade de compra de polímero para os próximos dias.  
* **Visão Mês:** A visão executiva para analisar a evolução histórica e o crescimento da capacidade produtiva da clicheria.

  ### **9.3. Índice de Refugo e Custo do Desperdício**

* **O que o gráfico mostra:** O quanto de chapa foi para o lixo e, mais importante, **por quê**.  
* **Como o sistema calcula:**   
  * \* **% de Refugo:** cm² de chapa perdida (OS de Retrabalho) / cm² Total Produzido) x100.  
  * **Custo Financeiro:** cm²  perdido x Custo do cm² do polímero.  
* **Visão no Dashboard:** \* Um número grande em vermelho: "R$ Perdidos em Retrabalho neste Mês".  
  * Um gráfico de pizza mostrando o *Motivo da Perda* (ex: 40% Falha de Lavagem, 30% Erro de Arte, 20% Máquina Laser, 10% Queda de Energia), extraído direto daquele "cenário alternativo" que mapeamos na Produção.

  ### **9.4. Taxa de Ocupação e Gargalos em Fila (Visão em Tempo Real)**

* **O que o gráfico mostra:** Onde os pedidos estão engarrafados *neste exato momento*.  
* **Como o sistema calcula:** Conta quantos IDs de Pedido estão com o status "Na Fila" em cada etapa e há quanto tempo estão lá (tempo de ociosidade).  
* **Visão no Dashboard:** Um painel de "Alertas de Gargalo" (semáforo).  
  * Verde: Filas normais (ex: pedidos aguardando menos de 2 horas).  
  * Amarelo: Fila crescendo (ex: 15 pedidos na fila da Arte Final há mais de 4 horas).  
  * Vermelho: Fila crítica (ex: pedido parado há mais de 24 horas aguardando cliente mandar a fonte).

### **9.5 Histórias de Usuário** 

### **9.5.1. Dashboard Operacional (Supervisor)**

---

### **Histórias de Usuário: Dashboard do Arte Finalista**

### **US-01: Visualização de Lead Time (Tempo de Atravessamento)**

**História:** Como Gestor da clicheria, eu quero visualizar um gráfico de barras com o tempo médio que os pedidos passam em cada etapa do processo, para que eu possa identificar rapidamente qual setor está gerando lentidão na entrega.

**Critérios de Aceite (Regras para o Desenvolvedor):**

1. O sistema deve calcular o tempo exato entre a mudança de status de cada etapa (Ex: `DataHora_Fim_Tratamento` \- `DataHora_Inicio_Tratamento`).  
2. O tempo em que o pedido fica com o status "Pausado \- Pendência de Arte" **não** deve ser contabilizado no Lead Time do Arte Finalista, para não prejudicar a métrica do funcionário.  
3. O frontend deve renderizar um gráfico de barras onde o eixo X representa as etapas (Fila Arte Final, Tratamento, Fila Produção, Produção, Expedição) e o eixo Y representa o tempo médio (em horas/minutos).

---

### **US-02: Medição de Throughput (Volume Produzido em cm²)**

**História:** Como Gestor, eu quero acompanhar o volume total de clichês produzidos em cm², podendo filtrar a visualização por Dia, Semana ou Mês, para medir o ritmo real da fábrica e bater metas de produção.

**Critérios de Aceite (Regras para o Desenvolvedor):**

1. O sistema deve somar o valor do campo `area_total_cm2` apenas dos pedidos que atingiram o status final "Despachado" dentro do período selecionado.  
2. A interface deve conter botões de filtro rápido no topo do gráfico: \[Hoje\] \[Esta Semana\] \[Este Mês\].  
3. O gráfico (linhas ou colunas) deve atualizar dinamicamente com base no filtro escolhido, mostrando a evolução da entrega ao longo do tempo.

---

### **US-03: Controle de Índice de Refugo e Custo de Desperdício**

**História:** Como Gestor, eu quero ver a porcentagem de chapa perdida e o custo financeiro desse refugo, divididos pelo motivo da falha, para que eu possa atacar os problemas de qualidade e estancar vazamentos de dinheiro.

**Critérios de Aceite (Regras para o Desenvolvedor):**

1. O sistema deve calcular a porcentagem de perda: `(Soma de cm² de OSs de Retrabalho / Soma total de cm² produzidos) * 100`.  
2. O sistema deve calcular o prejuízo financeiro: `Soma de cm² de Retrabalho * Custo padrão do cm² do polímero` (valor cadastrado nas configurações).  
3. O dashboard deve exibir o valor financeiro perdido em destaque (ex: cor vermelha).  
4. O dashboard deve exibir um gráfico de pizza mostrando a distribuição percentual dos "Motivos de Refugo" (dados extraídos do fluxo de exceção da Produção).

---

### **US-04: Alertas de Gargalo e Taxa de Ocupação (Tempo Real)**

**História:** Como Gestor, eu quero ver um painel em tempo real mostrando quantos pedidos estão parados em cada fila de espera e há quanto tempo, para que eu possa cobrar a equipe ou remanejar prioridades antes que o pedido atrase.

**Critérios de Aceite (Regras para o Desenvolvedor):**

1. O sistema deve rastrear e contar os IDs de pedidos que estão com os status "Na Fila da Arte Final" e "Na Fila de Produção".  
2. O cronômetro de ociosidade deve rodar em tempo real na tela.  
3. O sistema deve aplicar uma regra de cores (Semáforo) baseada no tempo de espera:  
   * **Verde:** Tempo aceitável (ex: \< 2 horas na fila).  
   * **Amarelo:** Atenção (ex: entre 2h e 4h na fila).  
   * **Vermelho:** Crítico (ex: \> 4 horas na fila sem que nenhum operador clique em "Abrir Pedido").

### **9.5.2. Dashboard Operacional (Operador \- Arte Finalista)**

### **O que deve ter no Dashboard do Arte Finalista (Sugestão de Layout "Clean"):**

No topo da tela, ele veria apenas 4 blocos (Cards) simples:

1. **Minha Comissão (Tempo Real):** O valor em R$ acumulado no mês e quanto ele já garantiu só no dia de hoje.  
2. **Meu Volume Hoje:** Quantas OSs e cm² ele já tratou e liberou hoje.  
3. **Termômetro de Qualidade:** Quantos retrabalhos voltaram da Produção hoje por erro de arte (isso equilibra a velocidade dele; não adianta fazer rápido e o clicherista perder a chapa por erro no arquivo).  
4. **Meus Pausados:** Um atalho rápido para ver quantos arquivos ele barrou e estão aguardando o cliente (para ele saber que a responsabilidade não está mais com ele).

Logo abaixo desses 4 blocos, ficaria a **Fila de Trabalho** propriamente dita, mas já ordenada de forma inteligente (Retrabalhos e Urgências piscando no topo).

---

### **Histórias de Usuário: Dashboard do Arte Finalista**

**US-05: Cálculo de Comissão em Tempo Real** **História:** Como Arte Finalista, eu quero ver o valor da minha comissão atualizado em tempo real na minha tela inicial, para me manter motivado e acompanhar meus ganhos diários e mensais. 

**Critérios de Aceite:**

1. O sistema deve multiplicar o volume de produção do operador (seja por cm² tratado e por quantidade de OS) pelo valor da taxa de comissão de 1% por serviço.  
2. O bloco deve exibir dois valores: "Ganhos Hoje" e "Ganhos no Mês".  
3. O valor só é computado quando o operador clica em "Gerar OS / Enviar para Produção" (finalizando sua etapa no Caminho Feliz).  
4. *Regra de Estorno:* Se um pedido voltar da produção como "Retrabalho por Erro de Arte", o sistema deve subtrair a comissão daquela OS do saldo do mês, para garantir a qualidade do serviço.

**US-06: Visão de Desempenho Diário (Volume)** **História:** Como Arte Finalista, eu quero ver um placar simples com a quantidade de OSs e/ou cm² que eu já finalizei no meu turno de hoje, para saber se estou dentro da minha meta de produtividade. 

**Critérios de Aceite:**

1. O sistema deve somar a área total (cm²) e a quantidade de IDs de pedidos processados pelo usuário logado na data atual (`Hoje`).  
2. O contador deve zerar automaticamente à meia-noite.  
3. Haverá uma meta diária configurada de  tratar 10 OSs por dia, exibir uma barra de progresso visual (ex: 5/10 OSs concluídas).

**US-07: Termômetro de Qualidade (Retrabalhos)** **História:** Como Arte Finalista, eu quero ser alertado imediatamente na minha tela inicial se algum serviço que eu tratei voltou da produção por erro de arquivo, para que eu possa corrigir rápido e não impactar a fábrica. **Critérios de Aceite:**

1. O sistema deve exibir um card de alerta destacando a quantidade de pedidos do usuário que retornaram com o status "Retrabalho \- Erro de Arte" (criado na exceção da Produção).  
2. O card deve ter um link clicável que filtra a fila de trabalho para mostrar apenas essas OSs problemáticas no topo da lista.

**US-08: Fila Inteligente e Pedidos Pausados** **História:** Como Arte Finalista, eu quero ter minha lista de tarefas limpa, mostrando apenas o que eu posso trabalhar agora, e deixando as OSs travadas em uma área separada, para não poluir minha visão. 

**Critérios de Aceite:**

1. A tabela/lista principal de trabalho deve exibir apenas os pedidos com status "Na Fila da Arte Final" e "Tratamento".  
2. Pedidos com status "Pausado \- Pendência de Arte" devem desaparecer da lista principal e ir para um card/aba chamado "Aguardando Cliente/Atendimento".  
3. A ordenação padrão da lista de trabalho deve trazer os pedidos com tag "Urgente" ou "Retrabalho" no topo, seguidos pela ordem de chegada (Data/Hora de entrada mais antiga).

### **US-09: Atalhos de Acesso Rápido (Triagem e Entrada Manual)**

**História:** Como Arte Finalista, quero ter botões de acesso rápido e bem visíveis no meu ecrã inicial para a "Triagem de E-mails" e para "Abrir Pedido Manual", para que eu possa dar entrada a novos serviços de forma imediata, sem ter de navegar por menus complexos. 

**Critérios de Aceite (Regras para o Desenvolvedor):**

1. O painel principal deve conter uma área de "Ações Rápidas" com botões de destaque (ex: "📧 Ir para Triagem" e "➕ Novo Pedidol").  
2. O clique no botão de Triagem deve redirecionar o utilizador diretamente para a interface *split-view* da caixa de entrada de e-mails.  
3. O clique no botão de Novo Pedido deve abrir a tela para Criar pedido..

### **US-10: Página Dedicada de Histórico de OS e Comissões (Extrato)**

**História:** Como Arte Finalista, quero ter uma página dedicada onde possa consultar todo o meu histórico de Ordens de Serviço (OS) tratadas e o detalhe das minhas comissões, para poder auditar o meu próprio trabalho e ter transparência sobre os meus ganhos ao final do mês. 

**Critérios de Aceite (Regras para o Desenvolvedor):**

1. O bloco de "A Minha Comissão" no painel inicial (US-05) deve ter um link ou botão chamado "Ver Extrato Detalhado".  
2. Ao clicar, o utilizador é levado para uma nova página contendo uma tabela ou listagem do seu histórico pessoal.  
3. A listagem deve mostrar para cada serviço: ID do Pedido/OS, Nome do Cliente, Data/Hora de Conclusão, Volume cm² e unidade, e o Valor Exato da Comissão ganha naquela OS específica.  
4. A página deve ter filtros de data (ex: Hoje, Esta Semana, Este Mês, Mês Passado) para facilitar a conferência antes do dia de pagamento.  
5. **Transparência de Estornos:** Caso haja alguma OS que tenha gerado retrabalho por erro de arte (penalização), essa linha deve aparecer destacada (ex: a vermelho, com o valor negativo), informando o motivo, para que o operador saiba exatamente porque perdeu aquele valor.

### **US-11: Tela de Criação de Pedido Manual (Dados Básicos)**

**História:** Como Arte Finalista (ou Atendimento), eu quero uma tela limpa e direta para registrar a entrada de um novo serviço avulso, para que eu possa oficializar demandas que chegam fora do e-mail oficial (WhatsApp, Balcão) sem perder tempo. 

**Critérios de Aceite (Regras para o Desenvolvedor):**

1. A tela deve apresentar um campo de busca inteligente (auto-completar) para **"Selecionar Cliente"** que busca pelo nome ou CNPJ no banco de dados.  
2. Deve haver um campo de seleção (Dropdown) obrigatório chamado **"Canal de Origem"** com as opções: *WhatsApp, Balcão, Telefone, Outros*.  
3. Deve haver um campo de texto livre chamado **"Briefing / Instruções"** para o operador digitar o que o cliente pediu (ex: *"Aproveitar a mesma chapa do mês passado, mas alterar a validade"*).

### **US-12: Cadastro Rápido de Cliente (Atalho com Dados Comerciais, Localização e Técnicos)**

**História:** Como Arte Finalista (ou Atendimento), eu quero poder cadastrar um cliente novo de forma rápida diretamente na tela de criação de pedido, registrando seus dados comerciais, sua localização (Unidade/Cidade) e mapeando todo o seu perfil técnico. Isso me ajudará na tomada de decisão técnica ao abrir futuros pedidos e na diferenciação de filiais, sem precisar interromper o fluxo de entrada.

**Critérios de Aceite (Regras para o Desenvolvedor):**

1. Ao lado do campo principal "Selecionar Cliente", deve haver um botão de atalho **"➕ Novo Cliente"**.  
2. Ao clicar, o sistema deve abrir uma janela sobreposta (Modal) dividida em duas seções de preenchimento.  
3. **Seção 1 \- Dados Comerciais e de Localização (Obrigatórios):**  
   * **Nome / Razão Social da Empresa:** (Nome oficial).  
   * **Apelido da Empresa:** (Campo fundamental que será puxado automaticamente pelo sistema na etapa de Padronização de Nomenclatura dos arquivos).  
   * **Unidade / Cidade:** (Campo de texto para diferenciar filiais de um mesmo cliente ou registrar a cidade destino, ex: *Matriz São Paulo* ou *Campinas*).  
   * **Responsável:** (Nome do contato principal/comprador).  
   * **Contatos:** E-mail e Telefone/WhatsApp.  
   * **Valor do cm²:** Campo financeiro (R$) exclusivo deste cliente (que será usado para calcular automaticamente o orçamento/comissão).  
4. **Seção 2 \- Perfil Técnico (Opcionais, porém em destaque \- Múltipla Escolha):**  
   * **Espessuras de Chapa (nível cliente):** Opções de múltipla escolha (Checkboxes) para marcar quais chapas o cliente suporta em geral (ex: *\[ \] 1.14, \[ \] 1.70, \[ \] 2.84*). Cada máquina pode ter suas próprias espessuras; o perfil do cliente serve como fallback.  
   * **Tipos de Tinta:** Opções de múltipla escolha (Checkboxes) indicando a tecnologia das impressoras do cliente (ex: *\[ \] À base d'água, \[ \] Solvente, \[ \] UV*).  
   * **Máquinas:** Cada máquina cadastrada possui: **Nome**, **Tipo de Banda** (Larga ou Estreita — único por máquina), **Lineatura** (valor único, em lpc), **Espessuras de Chapa** (múltiplas, override do perfil do cliente) e **Substratos** (múltiplos, específicos da máquina). *(Substratos são gerenciados por máquina — ver Bloco 2 da US-14.)*  
5. Ao clicar em "Salvar", o cliente e todos os seus perfis (comercial, localização e técnico) são inseridos no banco de dados e a janela se fecha. O campo "Selecionar Cliente" da tela de pedido já deve ficar preenchido automaticamente com esse novo cadastro. Sempre que esse cliente for selecionado no futuro, o sistema poderá exibir a Unidade/Cidade ao lado do nome e um pequeno ícone de "info" (tooltip) mostrando as tags técnicas para guiar o Arte Finalista

### **US-13: Inserção de Caminhos de Rede e Miniatura do Serviço**

**História:** Como Arte Finalista, eu quero registrar o caminho onde salvei os arquivos na rede da empresa (ou o link externo) e anexar apenas uma miniatura da arte visual, para manter o sistema leve, rápido e não duplicar arquivos pesados no servidor.

**Critérios de Aceite (Regras para o Desenvolvedor):**

1. O sistema **não** deve permitir o upload de arquivos de produção (como .PDF, .AI, .CDR).  
2. A tela deve conter um campo de texto obrigatório chamado **"Caminho do Arquivo / Link"**, onde o operador vai colar o diretório da rede local (Ex: `Z:\Producao\Clientes\ApelidoEmpresa`) ou o link da nuvem (WeTransfer/Drive).  
3. A tela deve conter uma área específica de upload (ou "Arrastar e Soltar") exclusiva para a **"Miniatura do Serviço"** (Preview).  
4. O sistema deve validar esse campo de miniatura, aceitando apenas formatos de imagem leves (ex: .JPG, .PNG).  
5. Esta miniatura será a identidade visual do Pedido, acompanhando o "Card" da OS em todas as filas (Arte Final, Produção e Expedição) para que os operadores identifiquem o serviço batendo o olho.  
   

### **US-14: Cadastro Manual de Pedidos/OS**

**História:** Como Usuário, quero preencher todos os dados do pedido em uma única tela organizada por blocos, para que eu tenha visão sistêmica do trabalho enquanto libero cada etapa técnica via validação.

#### 🎨 Estrutura da Interface (UI) e Regras de Habilitação

O formulário será exibido com todos os blocos visíveis, mas apenas o primeiro estará "ativo". Os demais estarão com uma opacidade reduzida (desabilitados) até que o anterior seja validado.

| Bloco (Assunto) | Gatilho de Ativação (Toggle/Status) | Ação Técnica Vinculada |
|---|---|---|
| **1. Identificação Comercial** | Preencher Cliente, Unidade, Tipo de Serviço e Nome do Serviço. | Libera o Bloco 2. |
| **2. Dados de Máquina** | Selecionar Máquina Alvo (e Substrato, quando disponível). Tipo de Banda é preenchido automaticamente pela máquina selecionada. Para Banda Larga: preencher Cilindro, Passo, Pistas e Repetições. | Libera o Bloco 3. Bloqueia avanço se Tipo de Serviço = Montagem e máquina for Banda Larga. |
| **3. Especificações do Clichê** | Selecionar Espessura da Chapa e Lineatura (podem ser auto-preenchidos quando há uma única opção). | Libera o Bloco 4. |
| **4. Cores do Serviço** | Selecionar ao menos uma cor. | Habilita o botão "Revisar e Gerar OS". |

#### Regras de Negócio

**RN01 - Validação em Cascata:** O Bloco n+1 só é habilitado quando todos os campos obrigatórios do Bloco n estiverem válidos (validação via Zod/React Hook Form, estratégia watch-based por campo).

**RN02 - Feedback Visual de "Pronto":** Ao completar um bloco, o ícone de cabeçalho muda de "Pendente" (Cinza) para "Validado" (Verde). O bloco permanece expansível para edição mesmo após validado.

**RN03 - Persistência de Erro:** Se o usuário alterar um dado crítico já validado (ex: trocar o cliente no Bloco 1, trocar a máquina no Bloco 2), o sistema invalida os blocos seguintes automaticamente, exigindo revalidação.

**RN04 - Tipo de Banda é propriedade da Máquina:** Cada máquina é cadastrada com um único tipo de banda (Larga ou Estreita). O Tipo de Banda no Bloco 2 é exibido como badge read-only, preenchido automaticamente ao selecionar a máquina — o operador não escolhe o tipo de banda, apenas seleciona a máquina.

**RN05 - Montagem não permite Banda Larga:** Quando o Tipo de Serviço (Bloco 1) for **Montagem**, o sistema bloqueia o avanço caso a máquina selecionada seja de Banda Larga. Um alerta informativo é exibido orientando a selecionar uma máquina de Banda Estreita.

**RN06 - Campos obrigatórios condicionais por Tipo de Banda:**
- **Banda Larga:** exige Cilindro (mm), Passo (mm), Qtd. de Pistas e Qtd. de Repetições. Campos opcionais: Cameron, Impressão Interna, Conjugado (com Tipo de Montagem).
- **Banda Estreita:** campos opcionais: Sentido de Saída (Cabeça / Pé).

**RN07 - Substrato vinculado à Máquina:** O campo Substrato/Material (Bloco 2) é populado com as opções de substrato cadastradas na máquina selecionada. Se a máquina não possuir substratos cadastrados, o campo não é obrigatório. Ao trocar a máquina, o substrato é resetado.

**RN08 - Impressão Interna reflete no Nome de Rede:** Quando o checkbox "Impressão Interna" estiver marcado (Banda Larga), o sistema insere o sufixo `_INTERNA` no nome de rede do arquivo, imediatamente antes do nome do operador (ex: `...NomeServico_INTERNA_Operador`).

#### Detalhamento dos Campos por Bloco (UI/UX)

**Bloco 1: Identificação Comercial** *(Ativo por Padrão)*
- **Miniatura do Serviço:** Upload via Ctrl+V (colar imagem). Área de drop 225×225px.
- **Nome do Serviço:** Input texto livre (Ex: "Rótulo Vinho Tinto").
- **Cliente:** Autocomplete (vinculado ao Supabase). Botão "➕ Novo Cliente" ao lado.
- **Unidade:** Select populado pelas unidades do cliente selecionado.
- **Tipo de Serviço:** Dropdown (Fechamento de Arquivo, Montagem, Reposição, Regravação).
- *Validação automática ao preencher todos os campos; avança para o Bloco 2 sem botão explícito.*

**Bloco 2: Dados de Máquina** *(Habilita após Bloco 1)*
- **Máquina Alvo:** Select populado pelas máquinas cadastradas no perfil do cliente selecionado.
- **Tipo de Banda:** Badge read-only (Banda Larga / Banda Estreita) preenchido automaticamente pela máquina selecionada. O operador não escolhe — cada máquina tem um único tipo.
- **Substrato / Material:** Select populado pelos substratos da máquina selecionada. Obrigatório quando a máquina possui substratos cadastrados. Resetado ao trocar de máquina.

  *Opcionais — Banda Estreita (exibidos na mesma linha do Tipo de Banda):*
  - **Sentido de Saída:** Botões toggle (↑ Cabeça / ↓ Pé).

  *Campos exclusivos — Banda Larga:*
  - **Opcionais (barra inline):** Cameron (checkbox), Impressão Interna (checkbox), Conjugado (checkbox + Tipo de Montagem: Boca c/ Boca / Pé c/ Pé / Pé c/ Boca).
  - **Cilindro (mm):** Input numérico obrigatório.
  - **Passo (mm):** Input numérico obrigatório.
  - **Qtd. de Pistas:** Input inteiro obrigatório (mínimo 1).
  - **Qtd. de Repetições:** Input inteiro obrigatório (mínimo 1).

  > **Restrição:** Se Tipo de Serviço = Montagem e máquina selecionada for Banda Larga, o sistema exibe alerta e impede avanço para o Bloco 3.

**Bloco 3: Especificações do Clichê** *(Habilita após Bloco 2)*
- **Espessura da Chapa:** Select populado pelas espessuras da máquina (ou do cliente como fallback). Auto-preenchido quando há apenas uma opção.
- **Fita Dupla-face (opcional):** Seleção inline (0.38mm / 0.50mm) com opção de limpar.
- **Lineatura:** Select populado pela lineatura da máquina. Auto-preenchido quando há apenas um valor.
- *Quando ambos os campos são auto-preenchidos (sem escolha do operador), o botão "Continuar →" aparece para validar e avançar ao Bloco 4.*

**Bloco 4: Cores do Serviço** *(Habilita após Bloco 3)*
- **Cores:** Seleção de múltiplas cores (CMYK base + cores especiais). Mínimo 1 cor.
- **Prévia do Nome de Rede:** Exibição em tempo real do nome gerado para o arquivo (ex: `OS0042_NomeServico_Cliente_Substrato_Lineatura_Espessura_Cores_NomeOperador.cdr`).
- Para pedidos com **Impressão Interna**: `..._NomeServico_INTERNA_NomeOperador`.

---

---

## **RN-TÉCNICA: Regras de Negócio para Montagem de Clichês (Step & Repeat)**
*Extraídas do Console Flexo v2.0 e adaptadas para o Sistema ManOS*

---

### **RT-01: Cálculo de Passo (Distorção do Cilindro)**

O **Passo** é o valor que representa a altura distorcida do clichê após compensar a espessura do fotopolímero. Deve ser calculado automaticamente pelo sistema ao preencher Z e Espessura no Bloco 2 e 3 da US-14.

```
Desenvolvimento = Pi × Z
Passo           = Desenvolvimento − Redução
```

| Parâmetro | Descrição |
|---|---|
| **Pi** | `3.14159` (padrão) ou `3.175` (alternativo) — selecionável pelo operador |
| **Z** | Número de dentes da engrenagem (entrada manual do operador) |
| **Redução** | Determinada pela espessura do fotopolímero selecionado |

**Tabela de Reduções por Espessura:**

| Fotopolímero | Opção Padrão | Opção 2 | Opção 3 |
|---|---|---|---|
| **1,14 mm** | 6,38 mm | 6,22 mm | — |
| **1,70 mm** | 9,0 mm | 9,5 mm | 10,0 mm |

> **Regra de precisão:** O sistema deve truncar (sem arredondar) o Passo calculado até 2 casas decimais: `Math.trunc(valor * 100) / 100`.

---

### **RT-02: Cálculo de Gap entre Repetições**

```
GapReps = (Desenvolvimento / Repetições) − AlturaFaca
```

- **GapReps < 0** → **ERRO CRÍTICO**: as facas se sobrepõem no cilindro. O sistema deve bloquear o avanço para produção e exibir alerta em vermelho: *"Sobreposição de facas detectada. Reduza o número de repetições ou a altura da arte."*
- **GapReps ≥ 0** → valor exibido em destaque (amarelo/verde) como confirmação visual.

**Posicionamento da matriz (referência para geração do nome e relatório):**
```
posY[r] = origemY − r × (AlturaFaca + GapReps)    // r = 0..Repetições-1
posX[p] = origemX + p × (LarguraFaca + GapPistas)  // p = 0..Pistas-1
```

---

### **RT-03: Cálculo de Aproveitamento de Material**

```
LarguraTotal   = Pistas × LarguraFaca + (Pistas − 1) × GapPistas
Aproveitamento = (LarguraTotal / LarguraMaterial) × 100
```

O percentual de aproveitamento deve ser exibido no resumo da OS como indicador de eficiência do layout.

---

### **RT-04: Regras Condicionais — Tipo de Banda**

O Tipo de Banda **não é escolhido pelo operador**: ele é determinado pela máquina selecionada no Bloco 2. Cada máquina possui um único tipo de banda (Larga ou Estreita), configurado no cadastro do cliente.

| Tipo | Campos Obrigatórios | Campos Opcionais | Comportamento |
|---|---|---|---|
| **Banda Estreita** | Máquina, Substrato (quando disponível) | Sentido de Saída (Cabeça/Pé) | Sem campos de layout no Bloco 2. Cálculo de passo via Montagem (Z × Pi − Redução) no painel de Montagem separado. |
| **Banda Larga** | Máquina, Substrato, Cilindro (mm), Passo (mm), Qtd. Pistas, Qtd. Repetições | Cameron, Impressão Interna, Conjugado (Tipo de Montagem) | Não compatível com Tipo de Serviço = Montagem. Desenvolvimento = π × Diâmetro. |

> O sistema exibe/oculta os campos condicionais dinamicamente ao selecionar a máquina no Bloco 2 (US-14, RN04 e RN05).

---

### **RT-05: Regras de Cameron (Marca de Registro)**

- Cameron é opcional e requer que o operador informe o caminho/link do arquivo `.cdr`.
- A **altura do Cameron é sempre igual ao Passo calculado**, garantindo alinhamento vertical com a montagem.
- **Posicionamento:**
  - `Pistas ≥ 2` → Cameron pode ser **central** (entre pistas) ou **lateral** (esquerda + direita).
  - `Pistas = 1` → Cameron **somente lateral**.
- O sistema deve registrar na OS se o Cameron foi incluído e qual o posicionamento escolhido.

---

### **RT-06: Validações Obrigatórias (bloqueiam geração da OS)**

| Campo | Regra de Validação |
|---|---|
| Z | Inteiro > 0 |
| AlturaFaca | Decimal > 0 |
| LarguraFaca | Decimal > 0 |
| Repetições | Inteiro ≥ 1 |
| Pistas | Inteiro ≥ 1 |
| GapPistas | Decimal > 0 **somente se** Pistas > 1 |
| GapReps (calculado) | Deve ser ≥ 0 para liberar envio à produção |
| Cameron (se ativo) | Caminho/link do arquivo `.cdr` não pode estar vazio |

Todas as validações devem ser implementadas via **Zod** no frontend, com mensagens de erro inline em cada campo.

---

### **RT-07: Redimensionamento e Distorção Final**

Após preencher o formulário, o sistema deve registrar na OS o valor do **Passo** como a *altura final distorcida do clichê*. Este valor é enviado ao Console Flexo via nomenclatura do arquivo, onde o grupo de montagem será escalado para `altura = Passo` antes da gravação.

```
nomeArquivo inclui: [Passo]mm como referência de distorção aplicada
grupo.SizeHeight = Passo  // aplicado no CorelDRAW pelo Console Flexo
```

---

### **RT-08: Entrada de Decimais (Tolerância de Formato)**

O sistema deve aceitar tanto vírgula quanto ponto como separador decimal em todos os campos numéricos:

```
"54,27" → 54.27  ✓
"54.27" → 54.27  ✓
```

Implementar via função de parse no frontend antes de enviar ao Zod: `value.replace(",", ".")`.

---

## **10\. Estratégia de Sprints (Entregas Incrementais)**

* **Sprint 0:** Autenticação, modelagem do BD, RBAC e log de auditoria.  
* **Sprint 1:** Fila de produção operando com listas filtráveis e eventos de mudança de status.  
* **Sprint 2:** Apontamento de refugo e rastreabilidade visual na Ficha de OS.  
* **Sprint 3:** Módulo de orçamentos, cálculo de área e gestão de Pedidos com aprovação automatizada.  
* **Sprint 4:** Triagem via API do Gmail e preenchimento ágil de ativos.  
* **Sprint 5:** Relatórios gerenciais, dashboards e rotinas de cálculo de comissão.

## **11\. Não-Objetivos do MVP**

* Integrações financeiras complexas com sistemas de estoque ou ERPs corporativos.  
* Criação de regras de comissionamento fracionadas ou tabelas complexas baseadas na dificuldade de cada job isolado.  
* Download e processamento automático de links de sistemas de nuvem terceiros.  
* Sugestão geométrica automatizada para reaproveitamento de retalhos (bin packing).

---

## **12\. Status de Implementação**

*Atualizado em: 2026-04-20*

### **Módulos Implementados ✅**

| Módulo | Rota | Observações |
| ----- | ----- | ----- |
| **Autenticação (RBAC)** | `/login` | Login via Supabase Auth, 7 roles, sessão persistente, ProtectedRoute por role |
| **Gestão de Clientes** | `/clients` | CRUD completo — cadastro, edição, perfil técnico (substratos, espessuras, tintas, máquinas) |
| **Criação de OS** | `/orders/new` | Formulário em 4 blocos com validação em cascata (Zod + React Hook Form), nomenclatura automática. `network_filename` capturado do último estado do NomenclaturePanel (respeitando checkboxes do usuário). |
| **Lista de OS / Pedidos** | `/orders` | Tabela com filtros, busca, paginação |
| **Detalhe da OS** | `/orders/:id` | Ficha técnica completa, timeline de status, avanço de status por role, painel de problemas de arte |
| **Editar OS** | Modal (OrderCard e Ficha de OS) | Campo "Canal" substituído por "Tipo de Serviço". Lógica condicional de Banda Larga replicada do Criar OS (Cilindro, Passo, Pistas, Repetições, Opcionais). |
| **Fila de Produção** | `/production` | Kanban drag & drop + modo lista, HUD com KPIs, filtros, avanço de status por role |
| **OrderCard — Ações Completas** | Fila de Produção | Botão `>` (avançar status, fundo verde), lápis (editar), dropdown `...`: Histórico (audit_logs), Voltar Processo (reverte para `tratamento`), Cancelar OS (com motivo), Registrar Refugo |
| **Miniaturas no OrderCard** | Fila de Produção | Hover com zoom (`scale-110`) + ícone lupa + tooltip; clique abre lightbox; botão "Alterar" abaixo de cada imagem |
| **Histórico de OS** | Modal no OrderCard | Exibe apenas alterações relevantes: etapa, responsável, urgência, retrabalho, observações, miniatura, cancelamento |
| **Gate de Precificação** | Modal `PricingGateModal` | Obrigatório ao avançar `tratamento → fila_producao`. Auto-calcula `width × height × num_sets × price_per_cm2` com piso mínimo de **R$ 25,00/cor**. Salva em `order_colors` + `order_financials`. Dois destinos: **"Aguardar CDI"** (`fila_producao`) ou **"Enviar para Produção"** (direto para `producao`). |
| **Taxa mínima por cor** | `PricingGateModal` | R$ 25,00 por cor. Clientes com `exempt_min_price = true` ficam isentos. Badge âmbar "mín. R$ 25,00/cor" exibido no modal para clientes não isentos. Configurável no cadastro de cliente (seção Financeiro). |
| **Status "Aguardando Liberar CDI"** | `fila_producao` | Sala de espera da CDI — OS aguarda máquina ficar disponível. Timestamps gravados para KPIs de gargalo futuros. |
| **Refugo (Scrap)** | Modal na Fila de Produção | Registrado no `OrderCard` quando `status = producao`; motivo, dimensões, perda financeira, flag de erro de arte |
| **Problemas de Arte** | Painel na Ficha de OS | Criar/resolver problemas; trigger pausa/retoma a OS automaticamente |
| **Comissões** | `/commissions` | KPIs, tabela com filtro de período; arte_finalista vê só as próprias; gestores veem todas + filtro de operador |
| **Gestão de Usuários** | `/settings` | CRUD de usuários — criar (sysadmin), editar role/meta/comissão, redefinir senha, desativar |
| **Relatórios / BI** | `/reports` | KPIs de volume, qualidade, retrabalhos, lead time, top clientes, canais de entrada |
| **Dashboard** | `/dashboard` | Painel inicial personalizado por perfil; comissão, volume do dia, retrabalhos, fila de trabalho |

---

### **Convenções de UX implementadas**

| Elemento | Padrão |
| ----- | ----- |
| **"Briefing"** | Substituído por **"Observações"** em todos os labels visíveis ao usuário |
| **"Canal"** | Removido do `EditOrderModal`; substituído por **"Tipo de Serviço"** |
| **Tipo de Serviço** | Fechamento de Arquivo, Montagem, Reposição, Regravação |

---

### **Triggers e Automações no Banco ✅**

| Migration | O que faz |
| ----- | ----- |
| `014_commissions_trigger.sql` | Cria comissão automaticamente quando OS avança para `fila_producao` (reescrita sem DECLARE — bug do Supabase SQL editor) |
| `024_fix_commission_trigger_security.sql` | Corrige RLS na tabela `commissions` (policy INSERT para `authenticated`) |
| `025_order_specs_no_color_proof.sql` | Adiciona `no_color_proof BOOLEAN DEFAULT false` em `order_specs` — dispensa Prova de Cores por OS |
| `026_clients_exempt_min_price.sql` | Adiciona `exempt_min_price BOOLEAN DEFAULT false` em `clients` — isenção da taxa mínima de R$ 25,00/cor |
| Trigger `order_audit_log` | Registra histórico de alterações em `audit_logs`; `old_data` captura UPDATEs corretamente (`TG_OP IN ('UPDATE', 'DELETE')`) |
| Trigger `order_issues` | Pausa a OS ao criar um problema de arte; retoma para `tratamento` ao resolver |
| Trigger `scrap_records` | Reverte comissão do arte finalista quando `requires_art_fix = true` |

---

### **Pendente / Futuro 🔲**

| Módulo | Prioridade | Observações |
| ----- | ----- | ----- |
| **Orçamentos** | Baixa | Marcado como opcional — pedidos entram direto como OS |
| **Triagem de E-mail (Gmail API)** | Futura | Interface split-view com sincronização Gmail; alta complexidade |
| **Checklist de Expedição** | Futura | Validação manual antes do despacho (cameron, micropontos, etc.) |
| **Dashboard Arte Finalista** | Futura | KPIs individuais: comissão, cm² hoje, retrabalhos por erro, pendências pausadas |
| **`is_internal_print`** | Futura | Campo "Impressão Interna" (opcional Banda Larga) — migration e UI pendentes |

---

### **Resumo do nosso dia de trabalho:**

Nós fizemos um trabalho excelente hoje. Mapeamos a espinha dorsal de todo o seu software:

1. **As 3 Portas de Entrada** (Triagem Inteligente de E-mail, Entrada Direta/Balcão e Conversão de Orçamento).  
2. **O Coração Operacional** (Padronização e Tratamento na Arte Final).  
3. **O Chão de Fábrica** (Fila de Produção focada no resultado).  
4. **O Faturamento e Logística** (Geração de Romaneio e Despacho).  
5. **Os Caminhos Tristes / Exceções** (Problemas de arquivo, refugo de chapa e falha na entrega).

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAloAAACkCAYAAABPXICqAAAvl0lEQVR4Xu3dd3wU1f438N8/z/O7z7WXewVF6QiIIk1ROoiVi6IgSG/SexEpYpQeqgJCAOmBSAu9Q+gEQnoggYQkpPeebDbJ7vfJObm7zp5JsrvJltns5/16fZ2d72wZMLv5MHvmzP8QAAAAAFjF/7D/5OTkoFAolEkFAACm0wctqLn69OkjtvQOHTpEWq1WbFfoqaeeEltGeXl5iS0AAACngKDlBO7cucOX169fp4yMDNqxYwd17tyZ/vOf/5CHhwdpNBpSq9V8u4uLC/Xt25e+//57vr2kpISysrL44zds2MCX7P4FBQW0du1a2r17N2VnZ1P79u3p448/pvj4eFq1ahUtXryYPvvsM9q3bx9dunRJvy8AAADOBEGrBmOBaNu2bfw2W0ZHR9O1a9d40GJhqkePHvqgxTx8+JA8PT1pzpw5FBAQQB9++CFFRETQmTNn9M/JQhs7Anb58mUetMLDw0mlUlHTpk1p8ODB/D7jx4+nL774glq1asUDHYIWAAA4KwQtALCK4uJilB0KAJQFQQsAarTExESD9b1791J+fj55e3tTXl4eH6fItGjRgo4dO0ZBQUH8q/Fly5bxvpubGz96y8TFxdHKlSv5bd32u3fv8qUSIGgBKA+CFgDUeG3bttXfXrNmDUVFRZGrqyvVrl2b6tevz/ssaH399dfk6+tLy5cv5z32NXlRURE1aNCAh7MDBw7Q888/T4WFhbR9+3aaOXMmubu765/b3hC0AJQHQctOVOmhlOzvJrYBAKoMQQtAeRC07KAwK4ryI2eQNsu19J/MZQPRAQCqC0ELQHkQtOwgL2IaD1msok91EjcDAFQJghaA8iBo2VBhViTlhk/RhyxdFacuEu8KAGA2BC0A5UHQsiFVzBxZyNJV7Pke4t0BQCHyHy6hooxLVJR5RSHlRdqSAnE3EbQAFAhBywZUaaGUHzVTFq7EKk75lVICtogPBwA7S7vQoDTYJCmq8sNXiLuJoAWgQAhaVqbOjqaCJz/IQlVlRWZcexAArOe5557jV07QBa1ZPV6hHz5+1SDwXD24ShaCyqurB1bKemIlRNyQ9SoqBC0Ax4CgZWXljckyVtEnO4pPAwBWkJubS0ePHqVhw4ZR8+bN6bXXXuMXThdLF7S8T23iS7fZX9INz3X0OOA0D1qJkbco7I4nuY54n297ePcoxYZ5kSo3krKSgyk3I4x+m9Cdts39hjbN7MWfIz3ej/KzwqlEHc/Xz+/6hXb/MoRc+jajC3sW0fKh7Sj42n5aMqgVRYecp6yUYDrhNod2LvyO33/2oH9S69atDf48CFoAyoOgZSXsSFZVQpauStKWiE8JANXw4MED6tChAy1aZPrJJ/v37+dLMWgdXT+d4sOv0bmdLjxoFeZHk8+5rfRrv7fo7I6FpC54QpGBZ8n3/J88aBUXxtH6yR/Tjp/606YZX/DnuPKXa2k/lu7fPMDXk6Pv8OWf8/qVBqsL5Dr8/dLgNZh+/baFvr9lzlc8kEmPaLHrj7KLvzMIWgDKg6BlJQXRs2XhydyKOddNfFoAMMOpU6eoUaNG+kvoVJU9xmhFBZ2T9aQl/eqwbt26fImgBaA8CFoWpkoPM5gnq7rFB8gHbhNfBmq4ohKi2481lJ5PNq3EbKIf/1KLu2Mxaedqk7Y43i6litkh7o7JNIUplH65OWVcaamQesdg/9g1G9VqNYIWgAIhaFlQYWZkpVM4VLU0mWXXXQPncfORhjILyC7VY1mBuDsWU5j4l+zIjK0q49oH4u7UKAMHDkTQAlAgBC0Lqs6YLGMVdbKD+HIOo0RTTCH3gykvP5eKS4r4+tlzZ/hSV1CGXbyYqUlBKyMjg5+5xyBoWU/Dhg0RtAAUCEHLAti1Cy35dWFFpclYZva1EbVaLcXHx1NgYCDNmzePBg8eTJ988gn/hf7MM89QrVq1qE6dOlSvXj1q3LgxNW3alFq0aEEtW7akd9991yI1ZeoUGjRoIH37bT/6/IvPqV/pcuMfG2jEyBF8yUp8jLOW7iy31p+MkwWgR7G5dP7WEwp+nEVpuRpKz9NSUHgmDZp+iMbMP0E7jgTRRndfSsoqpifJKkrIKKJ1O+/yx/6xz4/i0tTUY9AO6jfpLxr14zG6cDuGP8c3Ezzou6kHafris/qg9fbbb1us2Nl8uj+XLmjdOe1God6H9SEo5IYH+V3cSau/70Rb5/ShOZ+8RrnpoZSREMAHhqfG+JAqL4rWjutK68Z3449hfbYszI2kIlUMJUXd5mforRvXjTISA/i2Jd+9Szt+GuAUQYtB0AJQHgQtC8h/XHaBaFvUkzNdxJfX27ZtG7Vr147efPNN2rNnDwUHByvig5cdsXr//fepqFhNUdFRlJaWSuqiQsrNy8ERLQELvzExMbIjWhMWnqKMfC0d84qglJwS3mPBiS0nuZymKb+eoaikAvpyjDvdDkrm9/ULSyO/h+n6oMWWx70e07HLEXTo/CMetKJLA9n+U6H01dh9dPlunNWOaAUFBfHbYtAqyI7QBy3P9dNLg1ZH8j65iTbP6k1p8X76QFWkiuVB69ax9XR531KDoMUqOyWEL3e5DKJDaydTUuRtvn5w9QQe4BC0AMBejAatbp9+S7UatKXaDdrZvF6p14aavWvemXcjtxbSEd8Ss6v3WpX4VEapMsIpN3yqLAxZu9gA+dmDmtCECRMoPDxc3C2oAcSgVVGduPJY1qtuWTpoSeGrQ+vC5wGA8lQatF589W16o1kHu1e9pqZ/QC48XPavfHPrYZJ5s7Gr0h9ZZeC7qVWSvlTcJahB2MUBpu1V03H/EpuWh3cx3Xhk3tfT5kg5+RSpYv+0SxXnhoq7U+N88803YgsA7KzCoDX8+xn6oDNr/lL97QOep8qWR8qWuqrfojN5XbtNw8bOkgUlVrMXLKMOH/XVr69c50aXrt7Sr/++aaf+9o8LV8gen5qeIe6iATbuiNEFrYHTDvJit9nXKGKwEsuUoOXl5cWX7NqFYvDZP78V3Tvcn9/WZK6QbWd1ek1Xeug1WtavrDLC5+lvs9eQbitOXUTJ/m6GOwlOi33t+PTTT4ttp8bGhY0bN46PfysqKhI324RWqzGpLOGNN94QWwBgZxUGredeaa4POZu27SXvu/7U4O0u9O6HX/BeTGwCXbt5hxq37MbXG77Thd7v1ocatexK7bp8SR169qVxU+fT9Vs+tGLtZtr8pzt9/OVQ/XOeOneZTpy5RDPnLaHvRkyhq9e9ae3G7eRx6AQNHDmVPyYuPkl//2derMM/NNkvErGkl8rQBa2ARxn6EMUG/C7fcou+n3ecug/cTj//doUWrPGihPQi8n+YTo9i83jQEi+7werll1+mJk2aUNu2bfl6wzdeLvfrwmjviaROXkz3DvWn3JifaeeM5uQ2vmFp+PqWAk8O1t+vJH05bRj5Bl3d0YsSA2eSOmUJpdz/gZKCZlJh0mIqTltG2yY1oQ0jXqeQs8N4P+xSaTjLlIcwXQEwup9XqBib6Z2dAMK+YtOdCWltGk0JH5O4fft2SktP5WMSU1KTqXfv3voxiuw+ljBmzBixBQB2VmHQ+vyrv0MRC1pTZrtQ9y8G0dgp8/RBa0zp7VET5+iDFlu26tCLRk4o69Vt3rH0AyWNps35VR+0PvrP4LKgdfZyaXDrXBrW7lLXzwbwoMX6LFz1HTyBB7tLV/4+4nX/wUNxFw2wi78y5QWtqMQC2n44iIbMOEyuW29RSGQWbT0QoN/Oztwy5YgWG2TOJPqslYWdtNCyrxFZwGJHtLZPbUre+7/mwSr86hi+TZOxgt/vxMpO5PFT67LHlgaoJ3cmkSpxEV9noSwxcAbtmNaMjq3oqA9grDaNqSd73TCPj4S9BGeVmZlJ69atE9tQgcLCQnJ1deVft9WvX5+HVHbGbefOnfkRckvVb7//xs+6nTxlMn3T95vS1/uaNmxcT/v2u9PxE8fowsXzFBgUaJGB7AUFBWILAOyswqDFvPzGu/qgY896vtZb4q5VqLIxWruPhdDRyxGyPitTgpZUUmnY0qQvlQUfXfkc+pbunxsu60vr4WXzvkYUqzArWtwtcFJt2rQRW6AQ7GgVO2rl5ubGz7xVFRbQ5s2baM+e3RUe0Vq4cCHNnDnT7KNuLKyxKV0AQDkqDVoMCzli8LFlvVC7hbhLleq0qEAWokyp0dsKxacyKsXfTRZ+bFUPD/USdwecGLuwMNQ8bKoPNheZqVjQWrx4sdgGADsyGrSgcpqSQlkIsmblhE2kIf0+opISy4zpYKbuKaThW6pfj5PN+9c3WIbuK22ouR4/fswnHDaGBS02QSwAKAeClgWkBe8ibQVnGlq8Sv4+8jZx4kR64YUXqhW6Nl8ukh3dq2rt967+GBMwT0JCgtiCGoxNQlwZFrSeffZZsQ0AdoSgZSGJd9fIQ5GFK9Sjh/iyevv27aPXX3+djh8/ztel1xEsr3TWnLFc0DrhX/XAB1XTrFkzsQU1WFJSEp0+fVps67GgNXnyZLENAHaEoGVBSfd+o5K0JbKAZIlS58SKL1epEyePU2BQAP2+/jf6+OOP6eChA3TkyBGKjYvhp5brpq9Y6pnDQ1JqTtlM5D+suECnr0fRpTuxfFqMU9ciKTwuj1/K5VZgEr+GHrvfDf9EuuAdQ4mZxXTyaqQ+aLHLrVRW+fn54q5CFWHQs/M6evSo2OJY0IqOxkkyAEqCoGVhyb4bZCGpuvXw4BfiyxjFjlodOXKYEhLjadr0qaUBK5Zu3ryhP6LFQhabEmP16bKzNNmFitmSXWyYLRMzy450rf7TmzxOh/Lr6U1fcpa6DviTZi07TynZJTyAHTj70OwjWuwU9Bs3btDIkSPJw8ND3AwmwuSkzisyMlJscTjrEEB5ELSsQFuiloWlqlTOw0lUmFX+B6qlVPTVoe4IlzllatAShYWFUf/+/cU2VMLd3V1sKQ77XEFZr9jXxmKvOuM1AcA6ELSsJC3EXRaczC1NsfkXujbXruvFssBU1dp8uXqD4ZcvXy62oAJjx44VW+BkEKoAHAOClhWxMwTF8GRK5YROoOL8FPHprKpEU/2yBFxCxrjk5GSxBU5qwIABYovz8/MTWwBgJwhaVpbs94fZA+SL8pPEp3EqcXFxYgskXn31VbEFYKBr165iCwDsBEHLBpJ8fpOFqYoq7MCn4sOdDjt9PTc3V2xDKR8fH7MvywI12+rVq8UWjgwDKAiClo1o2fXMMpfLgpWu2Izv1h747kgqmyvImXl6eootcHIbN24UW9S9e3exBQB2gqBlQ6lBO2UBS1fFqgzx7k6PTUEBf6tbt67YAuDEKwQEBgYarAOA/SBo2Zh4bcScsAmkzsWYpIqcOXNGbDktzI8EFRFDeFFRkcE6ANgPgpYdpARsI03GMh60SgqzxM0gsWPHDrHllIYMGSK2APTKm1cNZx4CKAOClp0k+qyt9NqF8DfxX+vO6MKFC2ILwAC74oLUggULDNYBwD4QtMAhOPPkjA0bNhRbADLPPPOMwXqdOnUM1gHAPhC0wCE8++yzYstpOHPIBNNNnjzZYP2LL8y/RioAWB6CFjiMXr16ia0a71//+pfYAjAJvm4GUAYELXAYISEhTnV0JyoqitRqtdgGMBnOPgSwPwQtcCh9+vQRWzWWm5ub2AKo1L59+wzWfX19DdYBwPYQtMDhOMNRnvbt24stAKPEAfFdunQxWAcA2+NBKzs7m/Ly8lAohyh2UWWxV9MqPDxc1lNKgXK1bdvWYL1WrVoG6wBgezxoATia8ePHi60ao3PnzmILwCTimKy5c+carAOA7SFogUM6ceKE2Kox0tLSxBYAADgoBC1wWBs2bBBbDm/o0KFiC8AsHTp0EFsAYEcIWqAobKB7VlaWSfXLL7/IeiiUs9fzzz9vsJ6RkSG7jxILoKZC0AJFKSwsFFuVGj16tNhyWDVl9nv2S5PNUp6amkqPHj0y2CbOg3bx4kWDdVOsWLFCbDnFmaimWrx4scH6zZs3DdYBwLYQtEBRzA1a7IxZ9i92R/f555+LLYf18OFDvoyIiKBLly7xcKWbzykyMpI++eQT2rZtG1+PjY0lFxcX6t69O/87YF+dsnDm5eXFZzZng7tXr17N+02aNNG/hru7O1/OnDmTLw8dOqTf5uxYwJWqXbu2wToA2BaCFiiKuUGLeeONN8SWQ1GpVDyU1BSdOnXiYYv9mS5fvkzBwcEGQatZs2Y0atQovs5m+/f09KRr167Riy++SHfv3uXhq0WLFvykAHaUr0GDBnxesW7dupGrqysP1snJyXz77NmzacyYMbR06VLpLoAE+3sDAPtB0AJFqUrQYsTT2h3JmjVrxBaAxeBrVQD7QtACRalq0HrppZfElkMICwsTWwDVJr6P8HMGYD8IWqAo4i8IUznqjOVjx44VWwDV1rdvX4P1evXqGawDgO0gaIGiVDVoMcOGDRNbFQrz+Ehs2dybb74ptgAsgk3xIOXv72+wDgC2g6AFilKdoMVotVqxJRO0tRlps1zp/p4PxU02o9FoxBaAxdSkaU8AHB2CFihKdYMWu+B0Ze7vasBDlq6Ct1Z+f2sJCAgQWwAWk5+fL7Zkc5oBgG0gaIGiVDdoMWzKgPIEbW1qELJ0ZesjW/jKEGxBfC/VlAlxARwNghYoivjLoSqOHz8utkpD1quygCUt/w0viA+xCjY/FIAtLFu2TGxRQUGB2AIAK0PQAkWxRNBinnnmGbp37x6/bSxk6SrMo6fwLJbl7e0ttgCshk0cK2KTv1abVkM+K/+v2AWACiBogaJYImgNHz6cnnrqKbpx40aFXxdWVNb8GvHo0aNiC8BqGjZsKLYoNDSUiouLxbZZIg635u+VZP/N4iYAKAeCFiiKJYKWjjjw3dSyxgB5nGUItrZ9+3axxZUXwEyi1VLEkTYG75W7K/+PeC8AECBogaJYKmjppnCoalnyyNY777xT+l827URFBWB5lr7Yeti+8t9TPqv/Kd4VACQQtEBRLBG0Qra/IftlUJUK3PQv8anNEh0dTXFxcTR79iwaOPA7cl3pSrNmzaQSTTHt2r2TL1kBWMuTJ0/EFte1a1exVamiJBfZ+0Na99Y+Jz4EAP4LQQsUpbpBK+CPl2W/BKpToft7iC9hEvbn0H1d6Ot3jwIC/HnQunPXm+75+iBogU1Mnz5dbOmZNN2DVkOPPFrI3hfllc+q/xUfDQCEoAUKU52gFfzn27IPf0vUgz0dxJeq1K1btwwGvo8YMYLWrVvHg9bjyAja674HQQtswtjF1i9evCi2DIhjsoxVst8f4lMonqNeJxUcB4IWKEpVg9b9nfVlH/qWLDZFhCnq168vtgDspn///mJLho0hLCoqotu3b//d1GrMDlm6crSpH5wtaLF/9On07Fk2pQ37KjkyMpI2bNhAn3/+ObVv3573IyIiaMiQIbR161b69NNP6csvv+Rnc+ukpaVRbGwsLV68mB4+fEgjR46k7t27U2BgIH377beUm5tL06ZNI7VazV+jume8OioELVCUqgStoG3NZR/21qjKBsiza8t5enqKbQC7ysrKElvl2rlzJ58SRff+e/RX9Y4O31trwteSCuFsQUulUulv64IW+4q5SZMmNGzYMEpNTaXevXvzPgtaDLuaxcaNGyk7O5s6duxImZmZvJ+QkECbNm3iQUsX6gcMGMA/D+/cucPvz4SHh9OpU6f4bWeEoAWKYm7QsvaRLLGCttQyeP3atWtTcnKyQQ/A0fj4+NBzzz3Hw5axge+mlqOELWcLWuZiR6nKs2bNGrFl1PLly8WWU0DQAkUxJ2j5rX9e9uFui7q0qjG98sor4u4AODatlsLc35T9vFenHOFrRAQtsDYELVAUU4NWwKZ/yT7UbVm+654WdwlAkXx9fcVWuYpTF8l+zi1RPqv+n/hSioKgBdaGoAWKYkrQstQ8WdWtIDcc1QLlGzt2rNgyxAa+H24l+/m2ZCl56gcELbA2BC1QFGNBq7ozvlu67u/5QNxFAEWpU6eO2DIQfvBd2c+1NUqpk5qaG7RcIvfQI1UcRRYmVrna3J0oPq1FbY4/KXtNU+tm9n2KL0wTn7LauvrOoojCBNnrWareuj1afEnFQNACRaksaFX12oXWLmtcGxHAUtzc3MSWXlHyL7KfZ2uWz+qnxF2oFo22pMIylblBq/WdCZSlyatWuUTtEZ/WYnJKCmSvZ25tjT8tPm21tbs7SfY6lqwdiefFl1QMBC1QlIqClv+GF2Qf2ku/fE7WM6c0mSso/eFcWb+8Cr04Un+7vNetbOoHACUK3dNI9nO8c0ZzWY9V7L0psl5FteeHv6eGKO+9ctfVcheibteunX7iX7FMZWrQYmdksnmgpEHrlX4tZb/wy6uTfpcM1q0RtNh8aOPHj1dc0Hr++ef5Uhe02N+Z7u/tVoSfweuyfkBcqGx/dPUg+bH+drcfvjXYhqAFYKLyglaJOlf2YZ0X8zNfnl7XjS780ZNSH/zA193GNaDAk4Mp98nP5Ln0Azro0o6OrehA6uQldHPvV/Tk7mT9c2yf2pSu7+pNJ1w70UOv0aROWUJxvtPo3PoeVJS6lIrTltGagbVox7SmdP/ccB7MPBa0pojr40ibabg/idd7k1ZTJO46gCKwSSOlQvd3k72nntyZxH/G/Y8N5O+X5JDZlPV4Ad8WfHoobS59b51w7Vj6fupImRHz//v+60pZkQsoJ3ohrR9ehwoSfqXds1qQqnTJnkP3vpRWftQsPq+SrthEmTExMfy6oLqKj4/nczSxSkxMpKSkJF5sKpWUlBRebL4ndpWFI56HKTcvh5YsXULHjh/lt1mlp6ebVGzCTbFXXrGgxaqV93j+i/2H7UtowZ6V5HpkM1+/GHKDDnmfJpd9a+hRWjTNLt2eWZLLt7WZ+BlN2rSA1hzbxtdZ0GJ/dt2fyxL11ltv8f276nPTIIAkFKRSnYHtqP+yCTRj2680oHR5PymcroTdoe+WT6SM4hza6XWIRq6dRaEpkfwxywJ3y56/qsX26ZlnntEHraYju1CbCZ9R38VjaeiqadR1dj/9vvrHPeB/Z81GdaXRv/1AiQVppeEqgjrO6EOfzh/Mbw9eOYXf98jds3Qm8Aq/narO4kGL/X9iPxvs5+f+/fvUqFEjPon0hQsX+M89mw/MHhC0QFHKC1pM5KkRpb8Elht8YEd7T6R4v2l0ye1TOvt7dzq2vAN57/+aB628WBd90Eq5P5uKUpbyoMV+IUTdnsgfXxD/K1/+NvRV8vipNQ9Xf055k4e3ld/+q/QXzSzaMqERnfmtO/+X/um1XenRle8pNXSOwX5o0peKuwugKC+//LLYopBdbQ1+jo8sac+XfkcH8vdCXowLXd7yqX47C03rh9XhP/9Zj+dTwPFB/H3F3iNHlnzA30PnN/akndOb07Ud/6HsqJ9kQUsVM4fyUwLFXakyH5+75HXlMj+ClZScRMXFRVY7oqWbOV96ROt88HXyjQnht88FX6M/zuyhdcf/pC9+GkqDXCeXhrGl9KvHOlr81+/kF3ufvv99jj5oWdqYMWP4UnpEi+3fQe9T1HRUFx7+klXptP/GMcooySkNLoNKg8pVWnF4E+256kljSvdNF7QseUSLBWJGF7S2nN+n37eRa2fS7yd3GOzv48xYvq8sBM7b7cr3a+Pp3bTryiEetNYe30bzd6+g0wFe9PupnXQ26Bp/rLEjWv7+/vqwbGsIWqAoFQUtJvrCJNKW/otb+sGtq8TAGbKeqcX+JS/2TC1NxjJKuI2gBcp2/nz5v4QCzZwmpTrvFVaq9IfiLtidqUFLx5wxWpdDb8t6rKwRtHRM/erw4n3DI1/SsmTQ0jF3jNalB7dkvcrKWNBiatWqRfs89tOUR3/QgZSrFqtvgn4VX8oAghYoSmVBi9GWqGVHtuxVJTiSBTXAwwOfyX62LV35UTMpPyVIfGlFMDdoMW1Kw9bb3mNk1ejKUFmvvArLjxWf0qJGP1gje01T6xP/ueLTWYRKo6aW3mNlr2ep8s0JF1+yXFczg2QhzRIVXhAvvpQeghYoirGgxTw+OUz2QW6Pirv+s7hrAIrFLhhckQd7O8l+vi1VBdGzqTArSnxJxahK0CpP3bp1+VgkUDZp0Oow/StZYNJ9FWms2Lgw6TqCFjgMU4IWU94AeVtVwtVepNUU0/bt26lTp05UVGT5QfDXb96lbweNp34Dx9m81q7fJu4O1ACrVq0SWwbC/vpE9rNe3cqPnCG+jOJYKmjZa/wPmEc8osVOBmBL/9gHfND9ueDr9Mn8wbT2+J/kE11239CUx/TRjwP44P3xG+fzEwrYQH3p4xG0wGGYGrSYiOPf8bOkxA93axYbk1WePn36UOfOnfkZUtX13CvN6Y1mHexaL772jrhbUAOMHl35pI7B2y03eanqyRwqSL0vvoTiWCpoubu7iy1QIF3QislJ4suec7/jJzQMWD6ReszpT71dRtKUzQt572zQVX3QuvckmJ8JOdXNRXLmpjeOaIHjMSdoMWzMVvaDcbIPeWtU8u1+4stXiF1fjn2NcOnyRSouKTsT6sLF87K5flhpNBr9415r0FYWeuxVtRu2k/yJoKYIDg4WW1ybNm2opKSEgndU/3I87OxCR2GJoNWyZUuxBQp1zUpjtCIQtMBRmBu0GD5APsO6A+RL0peIL2uSgMAAevIkmq5eu0L9+vWj7Tv+pIOHDlBsXAxlZWeSuqiQHj9+zL9yYJMNvtb4fX3QWbpqI127eVcWgCqrURN/lPXGTpkn65VXbtv3y3pxcQniHwlqgOzsbP1ttVpNTZs2lWwlCvP4SPYeMLXYmKz85ACD51MySwStkJAQsQUKxX7e37s7iUaFrrZYvXlrhPgyBhC0QFGqErSYqDPfyz7wLVnxNxeJL2kSFrRCQoJ5oOrzdR8qUOWXvtELDY5ohYaG8qD10ksv0WtN2vOA82brHvqww8JWalo6v91vyEQ66HmK+g6ZQHWbdyT/wPu0bPUmehz1hI/r0gWtnr2H8OX90EfUqGVXfnvybBe+PHXOi+ITkmj+L6v4empaBj0ovd+OPQdpwPDJpb+Ec/Sv/TjyifhHghqABS02kWOzZs34JI/lqUrYyo+cSYXZ0eJTKZolghYo34cffsj/sWuNMbXGIGiBolQ1aDGaovzSD3vLjtlKuPJF6TNrxZeympbvfawPOUO+n0GffT2cvhk0nhq83Zk+/KgvjZs6n74bMYVafvAZv0+XTwfQN4PH0+DR06nv4Al8Oyvdc7AaPelHfY/dHjRqGg0dM1Pf+7L/9/RO+89oWGmP9dlrsf5LdfB1iLN7ePAL2XuionKEge/lqW7Qeu+998QWmGnz5s3UvXt3PpM7u2SP7sSCf//739S4cWNq1aoVtW3bVl89e/akvn370qhRo2ju3Lnk6upKe/fupZMnT5KXlxdFRUWRVmu7z21jELRAUaoTtJjwo/0qnNTU3GID7e3hhdotDIKSPeqV+m3E3QInZcoAeTYmS5XxSHyoQ6hO0IqOjlbUL3RHwmaM79Wrl9iukRC0QFGqG7QYTXEBZQaPlv0yMKeSbvYp/QAtEZ/aZtiHd15+fukvAduXWm37Q+ugbOyi6eJ7RFdsTJYjq07QGjGi8rE5ILdu3To+LtWZIGiBolgiaDGaagyQx4zvAHIP3OWTmqpifnSoge/lqU7QAvOw8ajOCEELFMVSQYuJOjde9ovBWLHL+8TfqtoZhgA1nfRyPWxMlpJnfDdVVYPW1KlTxRZUIj8/n+7evSu2nQKCFiiKJYMWo9UUmTypadnAdwCoDBsg76gD38tTlaDF5r4LCwsT21CJis5udQYIWqAolg5aTMSxAbJQVV7Z8uxCAEdWXJAmthxWVYJWu3aYzNccQ4YMEVtOBUELFMUaQYth10bMCBguC1esEq/35ke+AMD5JCcnm13sUltiD1V+JSUlUUJCgqzvDKWDoAWKYq2gxfAZ5DMNB8hrMPAdAMxQp04dsQWVwN8XghYojDWDFhN9fpJ+ni12gej4WwhaAGC6rKwssQUVYLOws0Hwzg5BCxTF2kGLYUe2Eq46x0R5AGA5Q4cOFVtQCTarOyBogcLYImgxWk2x2AIAqNThw4fFFlTC399fbDklBC1QFFsFLQAAc7CLcANUBYIWKAqCFgAoETtzDky3dCnGv+ogaIGiIGgBgNIMHz5cbIERznLBaFMgaIGiIGgBgNJcu3ZNbIERDx48EFtOC0ELFAVBCwCUpFmzZmILjHDWi0dXBEELFAVBCwCU4saNG2ILTPDCCy+ILaeGoAUAAFAOzJtVNX369BFbTg1BCwAAQBAZGSm2AKoEQQsAAEDQs2dPsQVQJQhaAAAAEuPHjxdbYKKkpCSx5fQQtAAAJDIzM8UWOBm1Wi22oALZ2dkG65MnTzZYBwQtAAADCFrWMWLECP3tzz//nC9DQkLoH//4B82aNYvWrl1LZ86c4et5eXnUqFEjqlevHr/NsD6zd+9e/fN4e3tTu3btSKvVUpcuXfh92f1KSkpo06ZNdOTIEf480scb06ZNG7EFlRCDVu3atQ3WAUELAMAAgpZ1BAcH62+zoMWmctFoNPoeu8TNqVOn+O3OnTvzoKRSqWjQoEH6+7D/N9KgxUJW06ZN6f3336fY2Fj90RQWtPbt28dv5+fnU3h4uP4xlfn555/FFhghBq3ly5cbrAOCFgCAAQQtx9KiRQuxxbGAJYYAY0wNZPA3c/+OnRGCFgCABIKWc6pbt67YAhNIg5b0qCX8DUELAEACQcv5dO/eXWyBiaRBq0GDBpItoIOgBQAggaDlXNiYLzaYHqpGGrSeffZZyRbQQdACAJBA0Kpc6L7uVBg3X2w7pICAALEFZpIGratXr0q2gA6CFgCABIJWxdTZMaTNcuX1YHdDcbNDcXd3p9TUVLENZpIGraKiIskW0EHQAgCQQNAqX9C2FvqQpStN5grKT3a8o0KtWrUSW1BFuqC1a9cuYQvoIGgBAEggaMmF7u8hC1m6UsXMEe+uWHFxcfTpp5+KbagGXdD66KOPhC2gg6AFACCBoGWouCBVFq7ECt3bRHyYRZRoii1Wf2zaSAWqfP06WIYuaLGJY6F8CFoAABIIWn8L8+gpC1UVlSr2R/Hh1TZv3jweiq5dv2oQmn76aQHNnz+fbnvfoitXvKioWE0XL16g0LBQmjJlCn311Ze0fsPvtO3PrXTE8zD97PIzf1xxSRGCloXpgtbx48eFLaCDoAUAIIGgVaYoL0kWpozVg11VGyDPLpmzYsUKevrpp+nFF1+k9957j5YtW0azZ8+m/fv3y45OsWJB686dO+Tmtpmv79ixnQYPHsxvd+zYUX/0KupJFO3Zu5vfLlSrELQsDDPDG4egBQAggaBFFLKrnSxEmVrFqYsoP8lPfEoDbIJQFqrY9QnBsSFoGYegBQAg4exB64F7Z1l4MrcKY+eKT0tHjhyhrl27klqtFjeBA2NBKyMjQ2yDBIIWAICEMwetkB2tZaGpqlWUuJC+7N6YgoKCxJeBGoQFrZ49e4ptkEDQAgCQcNagFfbXx7KwVN1ypKkfoGpY0OrQoYPYBgkELQAACWcMWqZM4VDVerC7kfhyUIOwoHX58mWxDRIIWgAAEs4StJ566il+yZQHezvJwtHOGc1Ik7GCzq2veKJSVmxmeHa/xMAZFOc7lTIj5lHU7Qm0b25Lg/uxrxHzknzFXYAaIDo6WmyBAEELAEDCkYPWli1b6PXXX6d169bRo0ePDLapVCpKT0/nZ/rdv3+fB622bduS3+8vywKU/9GBfMmCVlLQLB6iNo6qSw8ujKCwy6Np//xWfPutfX34ct+8d+nPKW/qH58cMtvwOUsDWYzXDwb7AzXD0qVLxRYIELQAACQcKWglJydT7dq1+TxU1ZESsFUWtsqre4f7y3rGKuV2P9JqHOxiw1qi83PUdG627avEzJMy2f/7Hxcso049vrFKDft+emlILxRfVq99+/ZiCwQIWgAAEo4QtA4fPmzxIwn+G1+VhaTqliZzOd264SW+lOIdHqqionyySwXuNX0y1Z8Xr6E6b35AbzTrYPVq17GX+PKcp6en2AIBghYAgISSg1b9+vXJ19d6Y518Vv9TFpaqXJkrKP7WEv68WVlZtGjRIqpXrx7t2bNHeNXKabQlslnhq1Ps+Yw5PrZQFoBsVeFnje+fjhiGrF3lwYSlxiFoAQBIKC1obdu2jU/2aSt+v70kD03mFhskX1Lx1006BQUF/Iy14cOH06uvvkoffPABjRgxgvbu3Ut+fn6UlJRE6qJCOnDwgD4o5ebm8OWkyZNo5cqVlJ+fR0OHDuU9NjZt/Phx+vuePXuG5s6dS+cvnPs7aGkqDjJs3Bq7OLIuaN0594TC/dNkYai8So0pMFh3X+kjuw+r3LRivpzf/5hsGytjQYvt42uvvUa+/sH6ABQblyALRbqaNPNng/XWHf9DwffDZPczpUaMmWGwL2FhYQhaJkDQAgCQUErQYtfrY18R2oPv2ufk4cnUYgPfr1juAtPsgtGxsTE8JPXq1YsHL7ZkF5SOjSvrs9Jd2zAy8rG+N3XaVPL29ua3dReUNha06tSpYxC02DL4ZhKvyT3/InWelveObwumIa130Irx5/k6C1qrp1zit+/fTtIHrVWTLpL7qnsUHZJJT0KzKD+jhG6ejOJBi21j9zm984FZQYtdD/KeX5A+ALGgFR4RRQ/Cwqnxu9147532n1FUdCx9P2kuTZ7lQt4+/rwfn5hMv/2xg5q3+5gmzljIH8f6e/YfodW/b6X0jExq1aEXzXNZSZ4nztKiFev1rzNs9HSDfenduzeClgkQtAAAJCoLWtmxWqtWQlguTR2xQNaXVk6CVtwtq0gN2ikPUUYq+ebXpDXhqzlzaDQavtRqDf/cunXdiQDsftL7Sk8QEB9rjC5oqXI0VJhTFqwKc7X6kMX6vPffbbo+u49um1pyW7ctJ7VI/3j2GOn9dUtjQUtKF4Dqt+j832UngyNQdZt35NtYsdvSbbr7s34DyeNZ1Xurk77HbuvuL2JHFBG0jEPQAgCQqChonZhgv3E7Yv3VXyXunlX4b6gtC1MVFRv4rikuEJ/CIR0eZr//18Eepg+GnzhtAb3e9ENZgLJGvdW6h8FrFxeX7SeClnEIWgAAEhUFLY9+9jsTTSy2L7biu+55WaiSVeYKSvBeLj7UYWk1RGdnqunMDNtXQYZ5R9/y8wtowpR51L7Ll1apfgPHUWJSsviy1LJlS75E0DIOQQsAQMJY0JrV+zBlp6hl4cd91d+Dn5Oi8mTbg24m6m9nJZc9PjHS8H4FWX9/1cTG8uhu675y0pUtgxbjt/4VebgyOJJl2/0B+2MnKjAIWsYhaAEASBgLWpFBGXw5sYcHJUTk0r2LsXxgMwta6ryyIBQblk3TPj9ImUllgerO2Sfk5xVPeenFdHhjAC0acZr3f/jak0LvpFB+Zgn92PcoD2C/DD1VGuSKeNCaU7o9q/Q5WNBaOOgEuU68YJegxfis+ocsZLGKvbZAvCvUcEuWlE3bwSBoGYegBQAgYSxosUqOzueDnVmQYiEpPV6lP4rFtrFBzux2ypN8vmTBiR2tSpYc6WL3Xzv9ctl98srWVdkaykhQUVpsAQ9trMeeKyOhkK+z17RX0GLSQvboA1bS9a8sPvAdHIOXl5f+NoKWcQhaAAASFQUtNgBdF5LsXfYKWgz/GpHNk4WvC52SGKzEdZBD0AIAkKgoaDHRN0qsWo8uFVC3RkN4idt0FXMLR5HAfjZs2GCwjqBlHIIWAIBEZUHLFl5++WU+KeW8efPETQB21aRJE7GFoGUCBC0AAAl7By1m4cKFfBkQEEC1atUStgIoB4KWcQhaAAASSgha5dmyZQu/7iGArUVFRVFeXp7Y5hC0jEPQAgCQUGrQ0mEXmG7evLnYBrAKdl3JyiBoGYegBQAgofSgJfXo0SNq3LgxqVQ4AxAs66effiIPDw+xLYOgZRyCFgCAhCMFLanly5dTly5d6Pz58+ImAJOcPn2amjZtSnPnzhU3VQhByzgELQAACUcNWlJZWVl8XM21a9f4UQl3d3dycXGhmTNnolD8aBUb78eCVXBwMCUnJ+svEm0uBC3jELQAACRqQtACsBUELeMQtAAAJBC0AEyHoGUcghYAgASCFoDpELSMQ9ACAJBA0AIwHYKWcQhaAAASCFoApkPQMg5BCwBAAkELwHQIWsYhaAEASOTk5KBQKBOroKBAfAuBAEELAAAAwEr+P6cE7GjqayR+AAAAAElFTkSuQmCC>