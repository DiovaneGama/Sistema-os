// Tipos gerados manualmente — futuramente substituir por `supabase gen types typescript`

export type UserRole =
  | 'sysadmin'
  | 'admin_master'
  | 'gestor_pcp'
  | 'comercial'
  | 'arte_finalista'
  | 'clicherista'
  | 'triador'

export type OrderStatus =
  | 'rascunho'
  | 'fila_arte'
  | 'tratamento'
  | 'pausado'
  | 'fila_producao'
  | 'producao'
  | 'pronto'
  | 'faturamento'
  | 'despachado'
  | 'devolvido'
  | 'cancelado'

export type QuoteStatus =
  | 'aguardando_aprovacao'
  | 'aprovado'
  | 'reprovado'
  | 'vencido'
  | 'revisado'

export type OrderChannel =
  | 'email'
  | 'whatsapp'
  | 'balcao'
  | 'telefone'
  | 'orcamento'
  | 'outros'

export type BandType = 'larga' | 'estreita'
export type PrintType = 'interna' | 'externa'
export type ServiceType = 'fechamento' | 'montagem' | 'reposicao' | 'regravacao'
export type ExitDirection = 'cabeca' | 'pe'

export interface Profile {
  id: string
  full_name: string
  username: string | null
  role: UserRole
  daily_os_goal: number
  commission_rate: number
  active: boolean
  created_at: string
}

export interface ClientMachineConfig {
  name: string
  band_type: 'larga' | 'estreita'
  lineature: number
  plate_thicknesses: string[]
  substrates: string[]
  // legado (migração gradual)
  band_types?: string[]
  lineatures?: number[]
}

export interface Client {
  id: string
  company_name: string
  nickname: string
  cnpj: string | null
  unit_city: string | null   // legado — substituído por units[]
  units: string[]
  contact_name: string | null
  email: string | null
  phone: string | null
  price_per_cm2: number | null
  substrates: string[]
  plate_thicknesses: string[]
  ink_types: string[]
  machines: ClientMachineConfig[]
  active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  client_id: string | null
  quote_id: string | null
  status: OrderStatus
  channel: OrderChannel
  assigned_to: string | null
  briefing: string | null
  file_path: string | null
  thumbnail_url: string | null
  original_filename: string | null
  queued_at: string | null
  treatment_started_at: string | null
  treatment_ended_at: string | null
  production_queued_at: string | null
  production_started_at: string | null
  production_ended_at: string | null
  dispatched_at: string | null
  is_urgent: boolean
  is_rework: boolean
  parent_order_id: string | null
  created_at: string
  updated_at: string
}

export interface OrderSpec {
  id: string
  order_id: string
  service_type: ServiceType | null
  service_name: string | null
  substrate: string | null
  band_type: BandType | null
  target_machine: string | null
  exit_direction: ExitDirection | null
  print_type: PrintType | null
  cylinder_diameter: number | null
  gear_z: number | null
  pi_value: number | null
  reduction_mm: number | null
  front_and_back: boolean
  plate_thickness: number | null
  double_tape_mm: number | null
  distortion_pct: number | null
  lineature: number | null
  tracks: number | null
  rows: number | null
  gap_tracks_mm: number | null
  has_conjugated_item: boolean
  is_pre_assembled: boolean
  network_filename: string | null
  production_filename: string | null
  camerom_id: string | null
  frozen: boolean
  frozen_at: string | null
  frozen_by: string | null
  created_at: string
  updated_at: string
}

export interface OrderColor {
  id: string
  order_id: string
  color_name: string
  width_cm: number | null
  height_cm: number | null
  area_cm2: number | null
  num_sets: number
  price: number | null
  sort_order: number
}

export interface OrderFinancials {
  id: string
  order_id: string
  total_area_cm2: number | null
  assembly_price: number
  colors_total: number
  total_price: number
  has_prior_quote: boolean
  created_at: string
  updated_at: string
}

export interface Quote {
  id: string
  quote_number: string
  client_id: string | null
  created_by: string | null
  status: QuoteStatus
  version: number
  parent_quote_id: string | null
  num_colors: number | null
  estimated_area_cm2: number | null
  plate_thickness: string | null
  color_price: number | null
  assembly_price: number | null
  total_price: number | null
  discount_pct: number
  valid_until: string | null
  rejection_reason: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Commission {
  id: string
  order_id: string
  profile_id: string
  stage: 'arte_final' | 'producao'
  base_amount: number | null
  rate: number | null
  commission_amount: number | null
  reversed: boolean
  reversed_reason: string | null
  created_at: string
}

export interface ScrapRecord {
  id: string
  order_id: string
  reported_by: string
  reason: string
  failure_stage: string | null
  lost_width_cm: number | null
  lost_height_cm: number | null
  lost_area_cm2: number | null
  financial_loss: number | null
  requires_art_fix: boolean
  created_at: string
}

export interface OrderIssue {
  id: string
  order_id: string
  reported_by: string
  category: 'erro_arquivo' | 'falta_info_tecnica' | 'duvida_montagem'
  description: string
  responsible: 'cliente' | 'supervisor'
  screenshot_url: string | null
  resolved: boolean
  resolved_at: string | null
  resolved_by: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  changed_by: string | null
  changed_at: string
}

// Placeholder para o tipo Database genérico do Supabase Client
// Substituir por: `supabase gen types typescript --project-id <id> > src/types/database.ts`
export type Database = Record<string, unknown>
