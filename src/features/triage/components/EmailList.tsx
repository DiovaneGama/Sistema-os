import { AlertTriangle, CheckCircle2, Clock, EyeOff, Mail } from 'lucide-react'
import type { MockEmail, EmailStatus } from '../data/mockEmails'

const STATUS_CONFIG: Record<EmailStatus, { label: string; className: string; icon: React.ReactNode }> = {
  novo:       { label: 'Novo',        className: 'bg-blue-100 text-blue-700',    icon: <Mail className="h-3 w-3" /> },
  em_triagem: { label: 'Em triagem',  className: 'bg-amber-100 text-amber-700',  icon: <Clock className="h-3 w-3" /> },
  convertido: { label: 'Convertido',  className: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="h-3 w-3" /> },
  ignorado:   { label: 'Ignorado',    className: 'bg-slate-100 text-slate-500',  icon: <EyeOff className="h-3 w-3" /> },
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  const d = Math.floor(h / 24)
  if (d > 0) return `${d}d atrás`
  if (h > 0) return `${h}h atrás`
  return 'agora'
}

interface Props {
  emails: MockEmail[]
  selectedId: string | null
  onSelect: (email: MockEmail) => void
  filterStatus: EmailStatus | 'todos'
  onFilterChange: (f: EmailStatus | 'todos') => void
}

const FILTERS: { value: EmailStatus | 'todos'; label: string }[] = [
  { value: 'todos',      label: 'Todos' },
  { value: 'novo',       label: 'Novos' },
  { value: 'em_triagem', label: 'Em triagem' },
  { value: 'convertido', label: 'Convertidos' },
  { value: 'ignorado',   label: 'Ignorados' },
]

export function EmailList({ emails, selectedId, onSelect, filterStatus, onFilterChange }: Props) {
  const filtered = filterStatus === 'todos' ? emails : emails.filter(e => e.status === filterStatus)

  return (
    <div className="flex flex-col h-full border-r border-slate-200 bg-white">
      {/* Header */}
      <div className="shrink-0 px-4 pt-4 pb-2 border-b border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800">Caixa de entrada</h2>
          <span className="text-xs text-slate-400">{filtered.length} e-mail{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {/* Filtros */}
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => onFilterChange(f.value)}
              className={[
                'rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
                filterStatus === f.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200',
              ].join(' ')}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Mail className="h-8 w-8 text-slate-200 mb-2" />
            <p className="text-xs text-slate-400">Nenhum e-mail nesta categoria</p>
          </div>
        ) : (
          filtered.map(email => {
            const st = STATUS_CONFIG[email.status]
            const isSelected = email.id === selectedId
            return (
              <button key={email.id} onClick={() => onSelect(email)}
                className={[
                  'w-full text-left px-4 py-3 border-b border-slate-100 transition-colors',
                  isSelected ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : 'hover:bg-slate-50 border-l-2 border-l-transparent',
                  email.status === 'ignorado' || email.status === 'convertido' ? 'opacity-60' : '',
                ].join(' ')}>
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {email.is_urgent && <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                    <span className="text-xs font-semibold text-slate-800 truncate">{email.from_name}</span>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{timeAgo(email.received_at)}</span>
                </div>
                <p className="text-xs font-medium text-slate-700 truncate mb-1">{email.subject}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-400 truncate max-w-[160px]">{email.from_email}</p>
                  <span className={['inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', st.className].join(' ')}>
                    {st.icon}{st.label}
                  </span>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
