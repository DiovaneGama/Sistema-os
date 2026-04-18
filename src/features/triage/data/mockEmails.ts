export type EmailStatus = 'novo' | 'em_triagem' | 'convertido' | 'ignorado'

export interface MockEmail {
  id: string
  from_name: string
  from_email: string
  subject: string
  received_at: string
  status: EmailStatus
  body: string
  // dados extraídos para pré-preencher a OS
  suggested_client: string | null
  suggested_briefing: string | null
  suggested_channel: 'email' | 'whatsapp' | 'balcao' | 'telefone' | 'orcamento' | 'outros'
  is_urgent: boolean
}

export const MOCK_EMAILS: MockEmail[] = [
  {
    id: '1',
    from_name: 'Carlos Silva',
    from_email: 'carlos@etitec.com.br',
    subject: 'Pedido urgente — clichê metalizado 1.14',
    received_at: '2026-04-15T08:12:00Z',
    status: 'novo',
    is_urgent: true,
    suggested_client: 'Etitec',
    suggested_channel: 'email',
    suggested_briefing: 'Clichê metalizado, espessura 1.14, 4 cores, tinta água. Prazo: sexta-feira.',
    body: `Bom dia,

Preciso com urgência de um clichê metalizado, espessura 1.14mm, para 4 cores (CMYK), tinta base água.

Dimensões aproximadas: 20cm x 15cm por cor.
Prazo de entrega: sexta-feira impreterivelmente.

Por favor confirmar recebimento e prazo.

Att,
Carlos Silva
Etitec Embalagens Ltda
(11) 99999-0001`,
  },
  {
    id: '2',
    from_name: 'Renata Coelho',
    from_email: 'renata.coelho@bomsabor.ind.br',
    subject: 'Solicitação de orçamento — linha biscoitos',
    received_at: '2026-04-15T09:45:00Z',
    status: 'novo',
    is_urgent: false,
    suggested_client: 'BomSabor',
    suggested_channel: 'email',
    suggested_briefing: 'Orçamento para linha biscoitos — substrato bopp, 6 cores, espessura 1.70.',
    body: `Olá,

Gostaria de solicitar orçamento para a nossa nova linha de biscoitos.

Especificações:
- Substrato: BOPP brilho
- Espessura do clichê: 1.70mm
- Número de cores: 6
- Tiragem estimada: 50.000 unidades/mês

Aguardo retorno para prosseguirmos.

Renata Coelho
Gerente de Compras — Alimentos Bom Sabor S/A`,
  },
  {
    id: '3',
    from_name: 'Marcos Drumond',
    from_email: 'marcos@textilcarioca.com.br',
    subject: 'Retrabalho OS #2041 — problema na cor cyan',
    received_at: '2026-04-15T10:30:00Z',
    status: 'em_triagem',
    is_urgent: true,
    suggested_client: 'Carioca',
    suggested_channel: 'email',
    suggested_briefing: 'Retrabalho da OS #2041 — cor cyan com desvio de registro. Requer nova arte.',
    body: `Boa tarde equipe,

Identificamos um problema na OS #2041 entregue na semana passada.
A cor cyan está com desvio de registro de aproximadamente 0,3mm, o que está causando rejeição no controle de qualidade da nossa linha.

Precisamos de retrabalho urgente. Já separamos as peças defeituosas.
Vocês podem verificar se o problema foi no arquivo ou no processo de gravação?

Anexo: fotos da peça com defeito.

Marcos Drumond
Indústria Têxtil Carioca
(21) 99102-7733`,
  },
  {
    id: '4',
    from_name: 'Luciana Fontana',
    from_email: 'luciana.fontana@gauchaflex.com.br',
    subject: 'Aprovação arte — embalagem iogurte natural',
    received_at: '2026-04-15T11:05:00Z',
    status: 'novo',
    is_urgent: false,
    suggested_client: 'GaúchaFlex',
    suggested_channel: 'email',
    suggested_briefing: 'Arte aprovada para embalagem iogurte natural. Aguarda abertura de OS para produção.',
    body: `Bom dia,

Conforme alinhado com nossa equipe de marketing, a arte da embalagem do iogurte natural foi aprovada internamente.

Segue arquivo final anexo (iogurte_natural_v3_APROVADO.pdf).

Especificações para produção:
- Substrato: BOPP transparente
- Espessura: 1.14mm
- Cores: 5 (incluindo verniz)
- Tinta: base água

Podem iniciar o processo de abertura de OS?

Luciana Fontana
Embalagens Gaúcha Flex`,
  },
  {
    id: '5',
    from_name: 'Eduardo Teixeira',
    from_email: 'eduardo@quimamazonica.com.br',
    subject: 'Dúvida técnica — distorção para cilindro 180mm',
    received_at: '2026-04-14T16:20:00Z',
    status: 'ignorado',
    is_urgent: false,
    suggested_client: 'QuimAm',
    suggested_channel: 'email',
    suggested_briefing: null,
    body: `Boa tarde,

Tenho uma dúvida técnica: qual o percentual de distorção que vocês aplicam para cilindros com diâmetro de 180mm e clichê 2.54mm?

Nossa equipe está preparando o arquivo e precisa dessa informação para ajustar as curvas.

Eduardo Teixeira
Química Amazônica Ltda`,
  },
  {
    id: '6',
    from_name: 'Henrique Borges',
    from_email: 'henrique@coopcentral.coop.br',
    subject: 'Novo pedido — rótulos saca de arroz 5kg',
    received_at: '2026-04-14T14:10:00Z',
    status: 'convertido',
    is_urgent: false,
    suggested_client: 'CoopCentral',
    suggested_channel: 'email',
    suggested_briefing: 'Rótulos saca de arroz 5kg — papel kraft, 3 cores, espessura 2.84.',
    body: `Olá,

Precisamos de clichês para os rótulos da nossa saca de arroz 5kg — nova embalagem 2026.

Detalhes:
- Substrato: papel kraft
- Espessura: 2.84mm
- Cores: 3 (preto + 2 spot)
- Dimensão aproximada: 30cm x 45cm

Arquivo em anexo para análise.

Henrique Borges
Cooperativa Agrícola Central`,
  },
  {
    id: '7',
    from_name: 'Aline Souza',
    from_email: 'aline@belezatotal.com.br',
    subject: 'Pedido expresso — clichê frasco shampoo 250ml',
    received_at: '2026-04-14T09:55:00Z',
    status: 'novo',
    is_urgent: true,
    suggested_client: 'BelezaTotal',
    suggested_channel: 'email',
    suggested_briefing: 'Clichê UV metalizado para frasco shampoo 250ml — 2 cores, espessura 1.14, entrega expressa.',
    body: `Bom dia,

Necessito com urgência de clichê para o frasco shampoo 250ml linha profissional.

Especificações:
- Substrato: metalizado
- Tinta: UV
- Espessura: 1.14mm
- Cores: 2 (prata + preto)
- Prazo: amanhã até as 17h se possível

É pedido expresso, topamos custo adicional se necessário.

Aline Souza
Cosméticos Beleza Total Ltda
(11) 97300-8844`,
  },
  {
    id: '8',
    from_name: 'Patricia Wirth',
    from_email: 'patricia.wirth@sulbrasil.ind.br',
    subject: 'Confirmação de entrega — OS #1987 e #1990',
    received_at: '2026-04-13T17:30:00Z',
    status: 'ignorado',
    is_urgent: false,
    suggested_client: 'SulBrasil',
    suggested_channel: 'email',
    suggested_briefing: null,
    body: `Boa tarde,

Passando para confirmar que recebemos as OS #1987 e #1990 em perfeito estado hoje às 14h.

Material está aprovado pelo nosso controle de qualidade. Muito obrigada pela agilidade!

Patricia Wirth
Frigorífico Sul Brasil S/A`,
  },
]
