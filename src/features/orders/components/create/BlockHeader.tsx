import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  number: number
  title: string
  validated: boolean
  isOpen: boolean
  onToggle: () => void
}

export function BlockHeader({ number, title, validated, isOpen, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-3 w-full text-left"
    >
      <div className={[
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold border-2 transition-colors',
        validated
          ? 'border-emerald-500 bg-emerald-500 text-white'
          : isOpen
            ? 'border-emerald-500 bg-white text-emerald-600'
            : 'border-slate-300 bg-white text-slate-400',
      ].join(' ')}>
        {validated ? <CheckCircle2 className="h-4 w-4" /> : number}
      </div>

      <h2 className={[
        'flex-1 text-sm font-bold transition-colors',
        isOpen || validated ? 'text-slate-800' : 'text-slate-400',
      ].join(' ')}>
        {title}
      </h2>

      {validated && !isOpen && (
        <span className="text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 mr-2">
          Preenchido
        </span>
      )}

      {isOpen
        ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
        : <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
      }
    </button>
  )
}
