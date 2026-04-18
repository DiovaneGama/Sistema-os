import { useState, useRef, useEffect } from 'react'
import { Search, Plus, Building2 } from 'lucide-react'
import { useClients } from '../hooks/useClients'
import type { ClientOption } from '../hooks/useClients'

interface Props {
  value: string          // client_id
  onChange: (id: string, client: ClientOption | null) => void
  onCreateNew?: () => void
  error?: string
}

export function ClientSearchInput({ value, onChange, onCreateNew, error }: Props) {
  const { clients, loading, query, setQuery } = useClients()
  const [open, setOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleSelect(client: ClientOption) {
    setSelectedLabel(`${client.nickname} — ${client.company_name}`)
    setQuery('')
    setOpen(false)
    onChange(client.id, client)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    setSelectedLabel(v)
    setOpen(true)
    if (!v) onChange('', null)
  }

  const displayValue = open || !value ? query || selectedLabel : selectedLabel

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar cliente por nome ou apelido..."
          value={displayValue}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          className={[
            'w-full rounded-lg border pl-9 pr-3 py-2 text-sm text-slate-800 placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
            error ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-white',
          ].join(' ')}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden">
          <ul className="max-h-60 overflow-y-auto py-1">
            {clients.map(client => (
              <li key={client.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(client)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                    <Building2 className="h-4 w-4 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{client.nickname}</p>
                    <p className="text-xs text-slate-400 truncate">{client.company_name}{client.unit_city ? ` · ${client.unit_city}` : ''}</p>
                  </div>
                </button>
              </li>
            ))}

            {clients.length === 0 && !loading && (
              <li className="px-3 py-3 text-center text-xs text-slate-400">
                {query ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
              </li>
            )}
          </ul>

          {onCreateNew && (
            <div className="border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setOpen(false); onCreateNew() }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Cadastrar novo cliente
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
