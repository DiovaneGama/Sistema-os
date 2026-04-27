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
  width: number  // cm — largura total com sangria
  height: number // cm — altura total com sangria
}

// Sangria aplicada em cada lado da montagem (1cm esquerda + 1cm direita = 2cm total por eixo)
const BLEED_CM = 2

/**
 * Calcula as dimensões totais de precificação para montagem banda estreita.
 * Retorna null se os specs não forem de montagem estreita ou estiverem incompletos.
 *
 * Fórmulas:
 *   largura = (largura_faca × pistas + gap × (pistas - 1)) / 10 + sangria
 *   altura  = (pi × Z) / 10 + sangria
 */
export function calcMontagePricingDimensions(specs: MontageSpecs | null): MontageDimensions | null {
  if (!specs) return null
  if (specs.service_type !== 'montagem' || specs.band_type !== 'estreita') return null
  if (!(specs.largura_faca_mm! > 0) || !(specs.gear_z! > 0) || !(specs.pi_value! > 0)) return null

  const tracks    = specs.tracks ?? 1
  const gapTracks = specs.gap_tracks_mm ?? 0
  const desenvolvimento = specs.pi_value! * specs.gear_z!

  const width  = ((specs.largura_faca_mm! * tracks) + (gapTracks * Math.max(0, tracks - 1))) / 10 + BLEED_CM
  const height = desenvolvimento / 10 + BLEED_CM

  return { width, height }
}
