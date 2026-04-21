import { supabase } from '../../../lib/supabase'

export const SCRAP_REASONS: { value: string; label: string }[] = [
  { value: 'lavagem_incorreta',   label: 'Lavagem Incorreta' },
  { value: 'exposicao_incorreta', label: 'Exposição Incorreta' },
  { value: 'erro_arquivo',        label: 'Erro no Arquivo (Arte)' },
  { value: 'dano_fisico',         label: 'Dano Físico' },
  { value: 'distorcao_incorreta', label: 'Distorção Incorreta' },
  { value: 'outros',              label: 'Outros' },
]

export interface CreateScrapInput {
  reason: string
  failure_stage: string
  lost_width_cm: number | null
  lost_height_cm: number | null
  financial_loss: number | null
  requires_art_fix: boolean
}

export async function createScrapRecord(
  orderId: string,
  reportedBy: string,
  input: CreateScrapInput
): Promise<{ ok: boolean; error?: string }> {
  const { error } = await (supabase as any)
    .from('scrap_records')
    .insert({
      order_id:        orderId,
      reported_by:     reportedBy,
      reason:          input.reason,
      failure_stage:   input.failure_stage || null,
      lost_width_cm:   input.lost_width_cm,
      lost_height_cm:  input.lost_height_cm,
      financial_loss:  input.financial_loss,
      requires_art_fix: input.requires_art_fix,
    })

  if (error) return { ok: false, error: error.message }

  // Erro de arte → retorna OS para tratamento
  if (input.requires_art_fix) {
    await (supabase as any)
      .from('orders')
      .update({ status: 'tratamento', updated_at: new Date().toISOString() })
      .eq('id', orderId)
  }

  return { ok: true }
}
