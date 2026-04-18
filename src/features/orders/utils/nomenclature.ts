/**
 * Motor de nomenclatura de arquivos — ManOS
 *
 * 3 formatos gerados:
 * 1. network_filename   → [Date]_[Nome_do_serviço]
 *    ex: 18-03-2026_Alimentos_Oliveira
 *
 * 2. production_filename → [Date]_-_[ClientNick]_[Lin]lpcm_[Substrate]_[Thickness]_[Colors]_[Service]_[Operator]
 *    ex: 18-03-2026_-_Etitec_63lpcm_Metalizado_1.14_CMYP_Alimentos_Oliveira_Joao
 *
 * 3. camerom_id         → [Nick]/data:[Date]/Cliche_[Thickness]/[N] Cores/[Service]/[Colors described]
 *    ex: Etitec/data:18-03-2026/Cliche_1.70/2 Cores/Alimentos Oliveira/Magenta Amarelo
 */

export interface NomenclatureInput {
  date?: Date | string       // defaults to today
  clientNickname: string
  serviceName: string        // nome do serviço ex: "Alimentos Oliveira"
  lineature?: number         // lpcm ex: 63
  substrate?: string         // ex: "Metalizado"
  plateThickness?: number    // ex: 1.14
  colors: string[]           // ex: ['C', 'M', 'Y', 'P'] or ['Magenta', 'Amarelo']
  operatorName?: string      // first name only
}

function formatDate(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}-${mm}-${yyyy}`
}

function slug(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // remove diacritics
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
}

function firstName(fullName: string): string {
  return fullName.split(' ')[0] ?? fullName
}

/** Iniciais das cores para o nome de produção: Cyan→C, Magenta→M, etc. */
function colorInitials(colors: string[]): string {
  return colors.map(c => {
    const upper = c.trim().toUpperCase()
    // Cores processo padrão
    if (upper === 'CYAN' || upper === 'C') return 'C'
    if (upper === 'MAGENTA' || upper === 'M') return 'M'
    if (upper === 'YELLOW' || upper === 'AMARELO' || upper === 'Y') return 'Y'
    if (upper === 'BLACK' || upper === 'PRETO' || upper === 'K') return 'K'
    if (upper === 'PANTONE' || upper === 'P') return 'P'
    // Primeira letra maiúscula para cores especiais
    return c.trim()[0]?.toUpperCase() ?? c
  }).join('')
}

export interface NomenclatureResult {
  networkFilename: string
  productionFilename: string
  cameromId: string
}

export function generateNomenclature(input: NomenclatureInput): NomenclatureResult {
  const date = input.date
    ? (typeof input.date === 'string' ? new Date(input.date) : input.date)
    : new Date()

  const dateStr = formatDate(date)
  const nick = slug(input.clientNickname)
  const service = slug(input.serviceName)
  const serviceRaw = input.serviceName.trim()

  // 1. Network filename
  const networkFilename = `${dateStr}_${service}`

  // 2. Production filename
  const parts: string[] = [dateStr, '-', nick]
  if (input.lineature) parts.push(`${input.lineature}lpcm`)
  if (input.substrate) parts.push(slug(input.substrate))
  if (input.plateThickness != null) parts.push(String(input.plateThickness))
  if (input.colors.length > 0) parts.push(colorInitials(input.colors))
  parts.push(service)
  if (input.operatorName) parts.push(slug(firstName(input.operatorName)))

  const productionFilename = parts.join('_')

  // 3. Camerom ID
  const colorCount = input.colors.length
  const colorList = input.colors.map(c => c.trim()).join(' ')
  const thicknessStr = input.plateThickness != null ? String(input.plateThickness) : '?'

  const cameromId = [
    input.clientNickname.trim(),
    `data:${dateStr}`,
    `Cliche_${thicknessStr}`,
    `${colorCount} ${colorCount === 1 ? 'Cor' : 'Cores'}`,
    serviceRaw,
    colorList,
  ].join('/')

  return { networkFilename, productionFilename, cameromId }
}
