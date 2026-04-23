import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'

export interface ClientTechProfile {
  substrates: string[]
  plate_thicknesses: string[]
  machines: ClientMachine[]
  units: string[]
}

export interface ClientMachine {
  name: string
  band_type: 'larga' | 'estreita'
  lineature: number
  plate_thicknesses: string[]
  substrates: string[]
  // legado
  band_types?: string[]
  lineatures?: number[]
}

export function useClientProfile(clientId: string | null) {
  const [profile, setProfile] = useState<ClientTechProfile | null>(null)
  const [nickname, setNickname] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!clientId) { setProfile(null); setNickname(null); return }
    setLoading(true)
    ;(supabase as any)
      .from('clients')
      .select('nickname, substrates, plate_thicknesses, machines, units')
      .eq('id', clientId)
      .single()
      .then(({ data }: any) => {
        if (data) {
          setNickname(data.nickname ?? null)
          setProfile({
            substrates: data.substrates ?? [],
            plate_thicknesses: data.plate_thicknesses ?? [],
            machines: data.machines ?? [],
            units: data.units ?? [],
          })
        }
        setLoading(false)
      })
  }, [clientId])

  return { profile, nickname, loading }
}

export function useOperators() {
  const [operators, setOperators] = useState<{ id: string; full_name: string }[]>([])

  useEffect(() => {
    ;(supabase as any)
      .from('profiles')
      .select('id, full_name')
      .eq('active', true)
      .order('full_name')
      .then(({ data }: any) => { if (data) setOperators(data) })
  }, [])

  return operators
}

// Cálculos de montagem (RT-01, RT-02)
export function calcMontage(
  z: number,
  piValue: number,
  reductionMm: number,
): { desenvolvimento: number; passo: number } {
  const desenvolvimento = piValue * z
  const passo = Math.trunc((desenvolvimento - reductionMm) * 100) / 100
  return { desenvolvimento, passo }
}

// desenvolvimento / repeticoes - alturaFaca  (conforme ProjetoFlexo/RecalcularTudo)
export function calcGapReps(desenvolvimento: number, repeticoes: number, alturaFaca: number): number {
  if (repeticoes <= 0 || alturaFaca <= 0) return 0
  return Math.trunc(((desenvolvimento / repeticoes) - alturaFaca) * 100) / 100
}

// Persistência
export async function saveCreateOrder(input: {
  client_id: string
  operator_id?: string
  service_type: string
  service_name: string
  client_unit?: string
  substrate: string
  channel: string
  is_urgent: boolean
  is_rework: boolean
  file_path?: string
  briefing?: string
  band_type: string
  target_machine: string
  exit_direction?: string
  has_conjugated?: boolean
  assembly_type?: string
  cilindro_mm?: number
  passo_larga_mm?: number
  pistas_larga?: number
  repeticoes_larga?: number
  has_cameron?: boolean
  plate_thickness: string
  lineature: string
  double_tape_mm?: string
  colors: string[]
  no_color_proof?: boolean
  montage?: {
    gear_z: number
    pi_value: number
    reduction_mm: number
    pistas: number
    repeticoes: number
    gap_pistas: number
    altura_faca: number
    largura_faca: number
    largura_material: number
    distortion_pct: number  // = passo calculado (desenvolvimento - reducao)
  }
  thumbnail_file?: File | null
  network_filename?: string
}): Promise<{ ok: boolean; orderId?: string; error?: string }> {
  try {
    // 1. Criar order
    const { data: order, error: orderErr } = await (supabase as any)
      .from('orders')
      .insert({
        client_id:    input.client_id,
        assigned_to:  input.operator_id ?? null,
        channel:      input.channel,
        is_urgent:    input.is_urgent,
        is_rework:    input.is_rework,
        briefing:     input.briefing ?? null,
        file_path:    input.file_path ?? null,
        status:       'fila_arte',
        queued_at:    new Date().toISOString(),
      })
      .select('id')
      .single()

    if (orderErr) return { ok: false, error: orderErr.message }
    const orderId: string = order.id

    // 2. Upload thumbnail
    if (input.thumbnail_file) {
      const ext = input.thumbnail_file.name.split('.').pop()
      const path = `thumbnails/${orderId}.${ext}`
      const { error: upErr } = await (supabase as any).storage
        .from('order-files')
        .upload(path, input.thumbnail_file, { upsert: true })
      if (!upErr) {
        const { data: urlData } = (supabase as any).storage.from('order-files').getPublicUrl(path)
        await (supabase as any).from('orders').update({ thumbnail_url: urlData?.publicUrl }).eq('id', orderId)
      }
    }

    // 3. Salvar specs
    const { error: specErr } = await (supabase as any)
      .from('order_specs')
      .upsert({
        order_id:        orderId,
        service_type:    input.service_type,
        service_name:    input.service_name,
        client_unit:     input.client_unit ?? null,
        substrate:       input.substrate,
        band_type:       input.band_type,
        target_machine:  input.target_machine,
        exit_direction:  input.exit_direction ?? null,
        has_conjugated:  input.has_conjugated ?? false,
        assembly_type:   input.assembly_type ?? null,
        cilindro_mm:     input.cilindro_mm ?? null,
        passo_larga_mm:  input.passo_larga_mm ?? null,
        pistas_larga:    input.pistas_larga ?? null,
        repeticoes_larga: input.repeticoes_larga ?? null,
        has_cameron:     input.has_cameron ?? false,
        plate_thickness: parseFloat(input.plate_thickness),
        lineature:       parseFloat(input.lineature),
        double_tape_mm:  input.double_tape_mm ? parseFloat(input.double_tape_mm) : null,
        gear_z:          input.montage?.gear_z ?? null,
        pi_value:        input.montage?.pi_value ?? null,
        reduction_mm:    input.montage?.reduction_mm ?? null,
        distortion_pct:  input.montage?.distortion_pct ?? null,
        tracks:          input.montage?.pistas ?? null,
        rows:            input.montage?.repeticoes ?? null,
        gap_tracks_mm:   input.montage?.gap_pistas ?? null,
        altura_faca_mm:    input.montage?.altura_faca ?? null,
        largura_faca_mm:   input.montage?.largura_faca ?? null,
        largura_material_mm: input.montage?.largura_material ?? null,
        no_color_proof:  input.no_color_proof ?? false,
        updated_at:      new Date().toISOString(),
      }, { onConflict: 'order_id' })

    if (specErr) return { ok: false, error: specErr.message }

    // 3b. Salvar network_filename — usa o valor já computado pelo NomenclaturePanel se disponível
    if (input.network_filename) {
      try {
        await (supabase as any)
          .from('order_specs')
          .update({ network_filename: input.network_filename })
          .eq('order_id', orderId)
      } catch (_) { /* best-effort */ }
    }

    // 4. Salvar cores
    if (input.colors.length > 0) {
      const colorRows = input.colors.map((name, i) => ({
        order_id:   orderId,
        color_name: name,
        sort_order: i,
        num_sets:   1,
      }))
      await (supabase as any).from('order_colors').insert(colorRows)
    }

    return { ok: true, orderId }
  } catch (e: any) {
    return { ok: false, error: e?.message ?? 'Erro inesperado' }
  }
}

// Geração de nomenclatura
export function buildNetworkName(opts: {
  date: Date
  nickname: string
  substrate: string
  lineature: string
  thickness: string
  colors: string[]
  serviceName: string
  userName: string
  includeSubstrate: boolean
  includeLineature: boolean
  isInternalPrint?: boolean
}): string {
  const d = opts.date
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const dateStr = `${dd}-${mm}-${yyyy}`

  const sanitize = (s: string) =>
    s.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '')

  const nickname = sanitize(opts.nickname).toUpperCase()
  const substrate = sanitize(opts.substrate).toUpperCase()
  const lineature = sanitize(opts.lineature)
  const thickness = opts.thickness.replace('.', '_')
  const COLOR_ABBR: Record<string, string> = {
    'ciano': 'C', 'magenta': 'M', 'amarelo': 'Y', 'preto': 'K',
    'branco': 'Br',
    'verniz brilho': 'P', 'verniz fosco': 'P', 'cold': 'P',
  }
  const colorsAbbr = opts.colors
    .map(c => {
      const lower = c.toLowerCase()
      if (COLOR_ABBR[lower]) return COLOR_ABBR[lower]
      // Pantones (P485C, P286U, etc.) → P
      if (/^p\d/.test(lower)) return 'P'
      return c.slice(0, 1).toUpperCase()
    })
    .join('')
  const serviceName = sanitize(opts.serviceName)
  const userName = sanitize(opts.userName)

  const parts = [`${dateStr}_-_${nickname}`]
  if (opts.includeSubstrate) parts.push(substrate)
  if (opts.includeLineature) parts.push(`${lineature}lpcm`)
  parts.push(thickness, colorsAbbr, serviceName)
  if (opts.isInternalPrint) parts.push('INTERNA')
  parts.push(userName)

  return parts.join('_')
}

export function buildBaseFileName(serviceName: string, date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const yyyy = date.getFullYear()
  const dateStr = `${dd}-${mm}-${yyyy}`
  const sanitized = serviceName.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '')
  return `${dateStr}_-_${sanitized}`
}

export function buildCameromName(opts: {
  orderNumber: string
  date: Date
  nickname: string
  colorCount: number
  serviceName: string
}): string {
  const d = opts.date
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const dateStr = `${dd}-${mm}-${yyyy}`
  const nick = opts.nickname.toUpperCase()
  const name = opts.serviceName.toUpperCase()
  return `${opts.orderNumber}  DATA: ${dateStr} / ${nick} / ${opts.colorCount} CORES / ${name}`
}

export function buildColorsString(colors: string[]): string {
  return colors.map(c => c.toUpperCase()).join(' ')
}

export function useNextOrderNumber(): string {
  const [num, setNum] = useState('...')
  const load = useCallback(async () => {
    const { count } = await (supabase as any)
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .neq('status', 'rascunho')
    const seq = (count ?? 0) + 1
    setNum(String(seq).padStart(3, '0'))
  }, [])
  useEffect(() => { load() }, [load])
  return num
}
