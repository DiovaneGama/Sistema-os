export interface MontageSpecs {
  service_type: string | null
  band_type: string | null
  gear_z: number | null
  pi_value: number | null
  tracks: number | null
  gap_tracks_mm: number | null
  largura_faca_mm: number | null
}

export interface MontageDimensions {
  width: number  // cm — dimensões brutas da faca (sem sangria; a sangria é aplicada na fórmula de área)
  height: number
}

/**
 * Calcula as dimensões brutas da montagem banda estreita (sem sangria).
 * A sangria (BLEED_CM = 2) é adicionada na fórmula de área do PricingGateModal,
 * garantindo consistência com entradas manuais do usuário.
 *
 * Fórmulas:
 *   largura = (largura_faca × pistas + gap × (pistas - 1)) / 10
 *   altura  = (pi × Z) / 10
 */
export function calcMontagePricingDimensions(specs: MontageSpecs | null): MontageDimensions | null {
  if (!specs) return null
  if (specs.service_type !== 'montagem' || specs.band_type !== 'estreita') return null
  if (!(specs.largura_faca_mm! > 0) || !(specs.gear_z! > 0) || !(specs.pi_value! > 0)) return null

  const tracks    = specs.tracks ?? 1
  const gapTracks = specs.gap_tracks_mm ?? 0
  const desenvolvimento = specs.pi_value! * specs.gear_z!

  const width  = ((specs.largura_faca_mm! * tracks) + (gapTracks * Math.max(0, tracks - 1))) / 10
  const height = desenvolvimento / 10

  return { width, height }
}
