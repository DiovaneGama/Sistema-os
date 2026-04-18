import { z } from 'zod'

// ── Criar OS (US-14 — formulário em cascata) ──────────────────────────────────

export const BASE_COLORS = [
  'Ciano', 'Magenta', 'Amarelo', 'Preto',
  'Branco', 'Verniz Brilho', 'Verniz Fosco', 'Cold',
] as const

export const SERVICE_TYPES = [
  { value: 'fechamento',  label: 'Fechamento de Arquivo' },
  { value: 'montagem',    label: 'Montagem' },
  { value: 'reposicao',   label: 'Reposição' },
  { value: 'regravacao',  label: 'Regravação' },
] as const

export const PI_OPTIONS = [
  { value: 3.14159, label: 'π 3.14159' },
  { value: 3.175,   label: 'π 3.175' },
] as const

// Bloco 1
export const block1Schema = z.object({
  client_id:    z.string().uuid('Selecione um cliente'),
  unit:         z.string().min(1, 'Selecione a unidade'),
  operator_id:  z.string().uuid().optional(),
  service_type: z.enum(['fechamento', 'montagem', 'reposicao', 'regravacao'], {
    errorMap: () => ({ message: 'Selecione o tipo de serviço' }),
  }),
  service_name: z.string().min(1, 'Informe o nome do serviço'),
})
export type Block1Input = z.infer<typeof block1Schema>

// Bloco 2
export const block2Schema = z.object({
  target_machine:    z.string().min(1, 'Selecione a máquina'),
  substrate:         z.string().optional(),
  band_type:         z.enum(['larga', 'estreita'], { errorMap: () => ({ message: 'Selecione o tipo de banda' }) }),
  exit_direction:    z.enum(['cabeca', 'pe']).optional(),
  has_conjugated:    z.boolean().optional(),
  assembly_type:     z.enum(['boca_boca', 'pe_pe', 'pe_boca']).optional(),
  cilindro_mm:       z.number().positive().optional(),
  passo_larga_mm:    z.number().positive().optional(),
  pistas_larga:      z.number().int().positive().optional(),
  repeticoes_larga:  z.number().int().positive().optional(),
  has_cameron:       z.boolean().optional(),
  is_internal_print: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.band_type === 'larga') {
    if (!data.cilindro_mm || data.cilindro_mm <= 0) {
      ctx.addIssue({ code: 'custom', path: ['cilindro_mm'], message: 'Informe o cilindro' })
    }
    if (!data.passo_larga_mm || data.passo_larga_mm <= 0) {
      ctx.addIssue({ code: 'custom', path: ['passo_larga_mm'], message: 'Informe o passo' })
    }
    if (!data.pistas_larga || data.pistas_larga <= 0) {
      ctx.addIssue({ code: 'custom', path: ['pistas_larga'], message: 'Informe a qtd de pistas' })
    }
    if (!data.repeticoes_larga || data.repeticoes_larga <= 0) {
      ctx.addIssue({ code: 'custom', path: ['repeticoes_larga'], message: 'Informe a qtd de repetições' })
    }
  }
})
export type Block2Input = z.infer<typeof block2Schema>

// Bloco 3
export const block3Schema = z.object({
  plate_thickness: z.string().min(1, 'Selecione a espessura'),
  lineature:       z.string().min(1, 'Selecione a lineatura'),
  double_tape_mm:  z.string().optional(),
})
export type Block3Input = z.infer<typeof block3Schema>

// Bloco 4
export const block4Schema = z.object({
  colors: z.array(z.string()).min(1, 'Selecione ao menos uma cor'),
})
export type Block4Input = z.infer<typeof block4Schema>

// Dados de Montagem (visível só quando service_type = montagem)
export const montageSchema = z.object({
  gear_z:       z.coerce.number().int().positive('Z deve ser positivo'),
  pi_value:     z.coerce.number(),
  reduction_mm: z.coerce.number().positive('Selecione a redução'),
  tracks:       z.coerce.number().int().min(1).default(1),
  rows:         z.coerce.number().int().min(1).default(1),
  gap_tracks:   z.coerce.number().min(0).default(0),
})
export type MontageInput = z.infer<typeof montageSchema>

// Schema completo da OS
export const createOrderSchema = block1Schema
  .merge(block2Schema)
  .merge(block3Schema)
  .merge(block4Schema)
  .extend({
    is_urgent:    z.boolean().default(false),
    is_rework:    z.boolean().default(false),
    channel:      z.enum(['email','whatsapp','balcao','telefone','orcamento','outros']).default('balcao'),
    file_path:    z.string().optional(),
    briefing:     z.string().max(1000).optional(),
    montage:      montageSchema.optional(),
  })
export type CreateOrderInput = z.infer<typeof createOrderSchema>

// ── Novo Pedido (entrada manual) ─────────────────────────────────────────────

export const newOrderSchema = z.object({
  client_id: z.string().uuid('Selecione um cliente'),
  channel: z.enum(['email', 'whatsapp', 'balcao', 'telefone', 'orcamento', 'outros']),
  is_urgent: z.boolean().default(false),
  is_rework: z.boolean().default(false),
  briefing: z.string().max(500).optional(),
  file_path: z.string().max(1000).optional(),
})

export type NewOrderInput = z.infer<typeof newOrderSchema>

// ── Especificações Técnicas ───────────────────────────────────────────────────

export const orderSpecsSchema = z.object({
  service_name: z.string().min(1, 'Informe o nome do serviço'),
  substrate: z.string().optional(),
  band_type: z.enum(['larga', 'estreita']).optional(),
  target_machine: z.string().optional(),
  print_type: z.enum(['interna', 'externa']).optional(),
  cylinder_diameter: z.coerce.number().positive().optional(),
  gear_z: z.coerce.number().int().positive().optional(),
  front_and_back: z.boolean().default(false),
  plate_thickness: z.coerce.number().positive().optional(),
  distortion_pct: z.coerce.number().min(0).max(100).optional(),
  lineature: z.coerce.number().int().positive().optional(),
  repetitions: z.coerce.number().int().positive().optional(),
  rows: z.coerce.number().int().positive().optional(),
  has_conjugated_item: z.boolean().default(false),
  is_pre_assembled: z.boolean().default(false),
})

export type OrderSpecsInput = z.infer<typeof orderSpecsSchema>

// ── Cor individual ────────────────────────────────────────────────────────────

export const orderColorSchema = z.object({
  color_name: z.string().min(1, 'Informe o nome da cor'),
  width_cm: z.coerce.number().positive('Largura deve ser positiva'),
  height_cm: z.coerce.number().positive('Altura deve ser positiva'),
  num_sets: z.coerce.number().int().min(1).default(1),
})

export type OrderColorInput = z.infer<typeof orderColorSchema>

// ── Orçamento ─────────────────────────────────────────────────────────────────

export const newQuoteSchema = z.object({
  client_id: z.string().uuid('Selecione um cliente'),
  num_colors: z.coerce.number().int().min(1, 'Mínimo 1 cor'),
  estimated_area_cm2: z.coerce.number().positive('Área deve ser positiva'),
  plate_thickness: z.string().optional(),
  color_price: z.coerce.number().min(0),
  assembly_price: z.coerce.number().min(0).default(0),
  discount_pct: z.coerce.number().min(0).max(100).default(0),
  valid_until: z.string().optional(),
  notes: z.string().max(1000).optional(),
})

export type NewQuoteInput = z.infer<typeof newQuoteSchema>

// ── Novo Cliente (inline) ─────────────────────────────────────────────────────

export const newClientSchema = z.object({
  company_name: z.string().min(2, 'Razão social obrigatória'),
  nickname: z.string().min(1, 'Apelido obrigatório').max(30),
  unit_city: z.string().optional(),
  contact_name: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  price_per_cm2: z.coerce.number().min(0).optional(),
  // perfil técnico
  substrates: z.array(z.string()).default([]),
  plate_thicknesses: z.array(z.string()).default([]),
  ink_types: z.array(z.string()).default([]),
})

export type NewClientInput = z.infer<typeof newClientSchema>
