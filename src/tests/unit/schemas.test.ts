import { describe, it, expect } from 'vitest'
import { block1Schema, block2Schema, SERVICE_TYPES, BASE_COLORS } from '../../features/orders/utils/schemas'

describe('block1Schema', () => {
  it('valida entrada correta', () => {
    const result = block1Schema.safeParse({
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      unit: 'SP',
      service_type: 'fechamento',
      service_name: 'Rótulo ABC',
    })
    expect(result.success).toBe(true)
  })

  it('rejeita service_type inválido', () => {
    const result = block1Schema.safeParse({
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      unit: 'SP',
      service_type: 'invalido',
      service_name: 'Rótulo ABC',
    })
    expect(result.success).toBe(false)
  })

  it('rejeita client_id que não é UUID', () => {
    const result = block1Schema.safeParse({
      client_id: 'nao-e-um-uuid-valido',
      unit: 'SP',
      service_type: 'montagem',
      service_name: 'Rótulo ABC',
    })
    expect(result.success).toBe(false)
  })
})

describe('block2Schema — banda larga', () => {
  const base = {
    target_machine: 'Máquina 1',
    band_type: 'larga' as const,
    cilindro_mm: 300,
    passo_larga_mm: 150,
    pistas_larga: 4,
    repeticoes_larga: 2,
  }

  it('valida quando todos os campos obrigatórios estão presentes', () => {
    expect(block2Schema.safeParse(base).success).toBe(true)
  })

  it('rejeita quando cilindro está ausente', () => {
    const result = block2Schema.safeParse({ ...base, cilindro_mm: undefined })
    expect(result.success).toBe(false)
  })
})

describe('constantes exportadas', () => {
  it('SERVICE_TYPES contém os 4 tipos esperados', () => {
    const values = SERVICE_TYPES.map(s => s.value)
    expect(values).toContain('fechamento')
    expect(values).toContain('montagem')
    expect(values).toContain('reposicao')
    expect(values).toContain('regravacao')
  })

  it('BASE_COLORS inclui CMYK', () => {
    expect(BASE_COLORS).toContain('Ciano')
    expect(BASE_COLORS).toContain('Magenta')
    expect(BASE_COLORS).toContain('Amarelo')
    expect(BASE_COLORS).toContain('Preto')
  })
})
