import { describe, it, expect } from 'vitest'
import { calcMontagePricingDimensions } from '../../features/production/utils/montageCalc'

const BASE_SPECS = {
  service_type:    'montagem',
  band_type:       'estreita',
  gear_z:          72,
  pi_value:        3.14159,
  tracks:          1,
  gap_tracks_mm:   0,
  largura_faca_mm: 120,
}

describe('calcMontagePricingDimensions', () => {

  describe('casos válidos', () => {
    it('calcula corretamente com 1 pista e sem gap', () => {
      // largura = (120 × 1 + 0 × 0) / 10 + 2 = 12 + 2 = 14 cm
      // altura  = (3.14159 × 72) / 10 + 2 = 22.619... + 2 = 24.619... cm
      const result = calcMontagePricingDimensions(BASE_SPECS)
      expect(result).not.toBeNull()
      expect(result!.width).toBeCloseTo(14, 4)
      expect(result!.height).toBeCloseTo(24.619, 2)
    })

    it('calcula corretamente com 3 pistas e gap entre elas', () => {
      // largura = (120 × 3 + 5 × (3-1)) / 10 + 2 = (360 + 10) / 10 + 2 = 37 + 2 = 39 cm
      const result = calcMontagePricingDimensions({
        ...BASE_SPECS,
        tracks:        3,
        gap_tracks_mm: 5,
      })
      expect(result).not.toBeNull()
      expect(result!.width).toBeCloseTo(39, 4)
    })

    it('usa tracks=1 quando o campo é null', () => {
      // tracks null → assume 1 pista → mesmo resultado que 1 pista
      const result = calcMontagePricingDimensions({ ...BASE_SPECS, tracks: null })
      expect(result).not.toBeNull()
      expect(result!.width).toBeCloseTo(14, 4)
    })

    it('usa gap=0 quando gap_tracks_mm é null', () => {
      const result = calcMontagePricingDimensions({ ...BASE_SPECS, gap_tracks_mm: null })
      expect(result).not.toBeNull()
      expect(result!.width).toBeCloseTo(14, 4)
    })

    it('inclui exatamente 2cm de sangria total na largura (1cm cada lado)', () => {
      // largura bruta = (100 × 1) / 10 = 10cm → com sangria = 12cm
      const result = calcMontagePricingDimensions({ ...BASE_SPECS, largura_faca_mm: 100 })
      expect(result!.width).toBeCloseTo(12, 4)
    })

    it('inclui exatamente 2cm de sangria total na altura (1cm cada lado)', () => {
      // desenvolvimento = 3.14159 × 10 = 31.4159mm = 3.14159cm → altura = 5.14159cm
      const result = calcMontagePricingDimensions({ ...BASE_SPECS, gear_z: 10 })
      expect(result!.height).toBeCloseTo(3.14159 + 2, 4)
    })
  })

  describe('retorna null para specs inválidos ou inaplicáveis', () => {
    it('retorna null quando specs é null', () => {
      expect(calcMontagePricingDimensions(null)).toBeNull()
    })

    it('retorna null para service_type diferente de montagem', () => {
      expect(calcMontagePricingDimensions({ ...BASE_SPECS, service_type: 'fechamento' })).toBeNull()
      expect(calcMontagePricingDimensions({ ...BASE_SPECS, service_type: 'reposicao' })).toBeNull()
    })

    it('retorna null para band_type larga', () => {
      expect(calcMontagePricingDimensions({ ...BASE_SPECS, band_type: 'larga' })).toBeNull()
    })

    it('retorna null quando largura_faca_mm é zero', () => {
      expect(calcMontagePricingDimensions({ ...BASE_SPECS, largura_faca_mm: 0 })).toBeNull()
    })

    it('retorna null quando largura_faca_mm é null', () => {
      expect(calcMontagePricingDimensions({ ...BASE_SPECS, largura_faca_mm: null })).toBeNull()
    })

    it('retorna null quando gear_z é zero', () => {
      expect(calcMontagePricingDimensions({ ...BASE_SPECS, gear_z: 0 })).toBeNull()
    })

    it('retorna null quando gear_z é null', () => {
      expect(calcMontagePricingDimensions({ ...BASE_SPECS, gear_z: null })).toBeNull()
    })

    it('retorna null quando pi_value é zero', () => {
      expect(calcMontagePricingDimensions({ ...BASE_SPECS, pi_value: 0 })).toBeNull()
    })

    it('retorna null quando pi_value é null', () => {
      expect(calcMontagePricingDimensions({ ...BASE_SPECS, pi_value: null })).toBeNull()
    })
  })

  describe('valores de pi aceitos', () => {
    it('aceita pi=3.14159 (padrão)', () => {
      const result = calcMontagePricingDimensions({ ...BASE_SPECS, pi_value: 3.14159 })
      expect(result).not.toBeNull()
    })

    it('aceita pi=3.14565 (alternativo)', () => {
      const result = calcMontagePricingDimensions({ ...BASE_SPECS, pi_value: 3.14565 })
      expect(result).not.toBeNull()
      // desenvolvimento = 3.14565 × 72 = 226.487mm = 22.648cm → altura = 24.648cm
      expect(result!.height).toBeCloseTo(22.6487 + 2, 2)
    })
  })
})
