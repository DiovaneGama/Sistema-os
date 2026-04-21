import { useState, useEffect } from 'react'
import { Copy, Check } from 'lucide-react'
import {
  buildNetworkName,
  buildBaseFileName,
  buildCameromName,
  buildColorsString,
} from '../../hooks/useCreateOrder'
import { useAuth } from '../../../../hooks/useAuth'

interface Props {
  orderNumber: string
  date: Date
  nickname: string
  substrate: string
  lineature: string
  thickness: string
  colors: string[]
  serviceName: string
  allBlocksValidated: boolean
  isInternalPrint?: boolean
  onNetworkNameChange?: (name: string) => void
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!value) return
    await navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-lg bg-slate-100 border border-slate-200 px-3 py-2 text-xs font-mono text-slate-700 break-all min-h-[36px]">
          {value || <span className="text-slate-400 italic">Preencha os dados acima…</span>}
        </div>
        <button type="button" onClick={handleCopy} disabled={!value}
          className="shrink-0 flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors">
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  )
}

export function NomenclaturePanel({
  orderNumber, date, nickname, substrate, lineature,
  thickness, colors, serviceName, allBlocksValidated, isInternalPrint, onNetworkNameChange,
}: Props) {
  const { user } = useAuth()
  const [inclSubstrate, setInclSubstrate] = useState(true)
  const [inclLineature, setInclLineature] = useState(true)
  const userName = (user as any)?.user_metadata?.full_name ?? (user as any)?.email?.split('@')[0] ?? 'Op'

  const networkName = allBlocksValidated
    ? buildNetworkName({ date, nickname, substrate, lineature, thickness, colors, serviceName, userName, includeSubstrate: inclSubstrate, includeLineature: inclLineature, isInternalPrint })
    : ''

  useEffect(() => { onNetworkNameChange?.(networkName) }, [networkName, onNetworkNameChange])

  const baseName = allBlocksValidated
    ? buildBaseFileName(serviceName, date)
    : ''

  const cameromName = allBlocksValidated && orderNumber
    ? buildCameromName({ orderNumber, date, nickname, colorCount: colors.length, serviceName })
    : ''

  const colorsStr = colors.length > 0 ? buildColorsString(colors) : ''

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-800">Nomenclaturas Geradas</h2>
        {!allBlocksValidated && (
          <span className="text-xs text-slate-400 italic">Complete os 4 blocos para gerar</span>
        )}
      </div>

      {/* Toggles para nome de rede */}
      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
          <input type="checkbox" checked={inclSubstrate} onChange={e => setInclSubstrate(e.target.checked)}
            className="accent-emerald-600 h-3.5 w-3.5" />
          Incluir Substrato
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
          <input type="checkbox" checked={inclLineature} onChange={e => setInclLineature(e.target.checked)}
            className="accent-emerald-600 h-3.5 w-3.5" />
          Incluir Lineatura
        </label>
      </div>

      <CopyField label="Nome de Rede (produção)" value={networkName} />
      <CopyField label="Nome Base do Arquivo" value={baseName} />
      <CopyField label="Identificação Camerom" value={cameromName} />
      <CopyField label="Cores do Serviço" value={colorsStr} />
    </div>
  )
}
