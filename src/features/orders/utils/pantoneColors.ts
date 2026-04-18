// Cores de processo (base)
export const PROCESS_COLORS: Record<string, string> = {
  'Ciano':         '#00AEEF',
  'Amarelo':       '#FFF200',
  'Magenta':       '#EC008C',
  'Preto':         '#231F20',
  'Branco':        '#FFFFFF',
  'Verniz Brilho': '#D0EAF8',
  'Verniz Fosco':  '#C8C8C8',
  'Cold':          '#A8C8E8',
}

// Tabela Pantone — formato PxxxC / PxxxU
export const PANTONE_HEX: Record<string, string> = {
  // Vermelhos
  'P485C':  '#DA291C', 'P485U':  '#E8392E',
  'P187C':  '#AC145A', 'P187U':  '#B52060',
  'P032C':  '#EF3340', 'P032U':  '#F04050',
  'P202C':  '#9B2335', 'P202U':  '#A52D3F',
  'P1795C': '#D22630', 'P1795U': '#DC3030',
  'P199C':  '#CC0033', 'P199U':  '#D41040',

  // Laranjas
  'P021C':  '#FE5000', 'P021U':  '#FF5C10',
  'P1655C': '#FF6720', 'P1655U': '#FF7030',
  'P1505C': '#FF6600', 'P1505U': '#FF7010',
  'P151C':  '#FF8200', 'P151U':  '#FF8C10',

  // Amarelos
  'P109C':  '#FFD100', 'P109U':  '#FFD800',
  'P123C':  '#FFC72C', 'P123U':  '#FFD040',
  'P012C':  '#FFD700', 'P012U':  '#FFE020',
  'P116C':  '#FFCD00', 'P116U':  '#FFD500',

  // Verdes
  'P347C':  '#009A44', 'P347U':  '#10A450',
  'P354C':  '#00B140', 'P354U':  '#10BB50',
  'P362C':  '#4F9C2E', 'P362C2': '#5AAA38',
  'P375C':  '#78BE20', 'P375U':  '#82C830',
  'P3415C': '#007A3D', 'P3415U': '#108045',

  // Azuis
  'P286C':  '#0032A0', 'P286U':  '#1040B0',
  'P300C':  '#0057B7', 'P300U':  '#1060C0',
  'P287C':  '#003087', 'P287U':  '#104090',
  'P072C':  '#10069F', 'P072U':  '#2010AF',
  'P2728C': '#2255CC', 'P2728U': '#3060D8',
  'P279C':  '#418FDE', 'P279U':  '#5098E8',
  'P3005C': '#0085CA', 'P3005U': '#108ED8',

  // Roxos / Violetas
  'P265C':  '#9B5FC0', 'P265U':  '#A568CC',
  'P2593C': '#8B2FC9', 'P2593U': '#9538D4',
  'P2685C': '#330072', 'P2685U': '#420082',
  'P2736C': '#4B0082', 'P2736U': '#580092',
  'P258C':  '#512D6D', 'P258U':  '#5E3878',

  // Rosas
  'P1767C': '#FBBFCB', 'P1767U': '#FCC8D4',
  'P812C':  '#FF3EB5', 'P812U':  '#FF48C0',
  'P1895C': '#FFAACC', 'P1895U': '#FFB8D8',

  // Marrons / Terrosos
  'P469C':  '#7A3C00', 'P469U':  '#844200',
  'P1545C': '#5C2017', 'P1545U': '#682820',
  'P4625C': '#4A1C00', 'P4625U': '#522200',

  // Metálicos
  'P877C':  '#8A8D8F',
  'P871C':  '#84754E',
  'P872C':  '#8C6D3F',
  'P874C':  '#9C7E45',
  'P8003C': '#9E7B30',
  'P8201C': '#6699CC',

  // Neutros / Cinzas
  'PCG1C':  '#F2F2F2',
  'PCG3C':  '#D0D0D0',
  'PCG5C':  '#A8A8A8',
  'PCG7C':  '#808080',
  'PCG9C':  '#585858',
  'PCG11C': '#303030',

  // Brancos / Transparentes
  'PWhite': '#FFFFFF',
}

export function getColorHex(name: string): string | null {
  // Cores de processo
  if (PROCESS_COLORS[name]) return PROCESS_COLORS[name]
  // Pantone exato
  if (PANTONE_HEX[name]) return PANTONE_HEX[name]
  // Busca parcial (ex: "P485" encontra "P485C")
  const upper = name.toUpperCase()
  const match = Object.keys(PANTONE_HEX).find(k => k.toUpperCase().startsWith(upper))
  return match ? PANTONE_HEX[match] : null
}

// Sugestões no novo formato PxxxC / PxxxU
export const PANTONE_SUGGESTIONS = [
  'P485C', 'P485U',
  'P286C', 'P286U',
  'P021C', 'P021U',
  'P347C', 'P347U',
  'P123C', 'P123U',
  'P1655C','P1655U',
  'P265C', 'P265U',
  'P202C', 'P202U',
  'P877C',
  'P871C',
  'P300C', 'P300U',
  'P032C', 'P032U',
  'P116C', 'P116U',
  'P354C', 'P354U',
  'P072C', 'P072U',
  'P375C', 'P375U',
  'P187C', 'P187U',
  'P151C', 'P151U',
]
