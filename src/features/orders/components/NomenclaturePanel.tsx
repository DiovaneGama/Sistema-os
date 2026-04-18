import { useMemo, useState } from 'react'
import { Copy, Check, FileText, Cpu, Hash } from 'lucide-react'
import { generateNomenclature, type NomenclatureInput } from '../utils/nomenclature'

interface Props {
  input: Partial<NomenclatureInput>
  onSave?: (result: { networkFilename: string; productionFilename: string; cameromId: string }) => void
  saving?: boolean
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} type="button"
      className="ml-auto shrink-0 rounded p-1 text-slate-400 hover:text-slate-700 transition-colors">
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}

export function NomenclaturePanel({ input, onSave, saving }: Props) {
  const ready = !!(input.clientNickname && input.serviceName && input.colors?.length)

  const result = useMemo(() => {
    if (!ready || !input.clientNickname || !input.serviceName || !input.colors) return null
    return generateNomenclature({
      clientNickname: input.clientNickname,
      serviceName: input.serviceName,
      colors: input.colors,
      date: input.date,
      lineature: input.lineature,
      substrate: input.substrate,
      plateThickness: input.plateThickness,
      operatorName: input.operatorName,
    })
  }, [input, ready])

  const rows = result
    ? [
        { icon: FileText, label: 'Rede', value: result.networkFilename },
        { icon: Cpu,      label: 'Produção', value: result.productionFilename },
        { icon: Hash,     label: 'Camerom', value: result.cameromId },
      ]
    : []

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nomenclatura gerada</h3>
        {result && onSave && (
          <button
            type="button"
            onClick={() => onSave(result)}
            disabled={saving}
            className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        )}
      </div>

      {!ready ? (
        <p className="text-xs text-slate-400 text-center py-2">
          Preencha cliente, nome do serviço e cores para gerar a nomenclatura
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-lg border border-slate-200 bg-white px-3 py-2.5">
              <div className="flex items-center gap-1.5 mb-1">
                <Icon className="h-3 w-3 text-slate-400" />
                <span className="text-xs font-medium text-slate-500">{label}</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 text-xs text-slate-800 font-mono break-all">{value}</code>
                <CopyButton text={value} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
