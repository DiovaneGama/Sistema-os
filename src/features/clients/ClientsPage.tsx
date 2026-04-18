import { useState } from 'react'
import { Plus, RefreshCw, Search, Pencil, PowerOff, Power, Building2, Phone, Mail, MapPin } from 'lucide-react'
import { useClientsFull } from './hooks/useClientsFull'
import { ClientFormModal } from './components/ClientFormModal'
import type { Client } from '../../types/database'
import type { ClientInput } from './hooks/useClientsFull'

const BADGE = 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'

function TechBadges({ items, color }: { items: string[]; color: string }) {
  if (!items?.length) return <span className="text-xs text-slate-300">—</span>
  return (
    <div className="flex flex-wrap gap-1">
      {items.map(i => (
        <span key={i} className={`${BADGE} ${color}`}>{i}</span>
      ))}
    </div>
  )
}

export function ClientsPage() {
  const { clients, loading, error, search, setSearch, reload, createClient, updateClient, toggleActive } = useClientsFull()
  const [modalClient, setModalClient] = useState<Client | null | undefined>(undefined) // undefined = fechado, null = novo

  async function handleSave(input: ClientInput) {
    if (modalClient) {
      return updateClient(modalClient.id, input)
    }
    return createClient(input)
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Clientes</h1>
            <p className="text-xs text-slate-400 mt-0.5">{clients.length} clientes cadastrados</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={reload} disabled={loading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors">
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button onClick={() => setModalClient(null)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors">
              <Plus className="h-3.5 w-3.5" />
              Novo Cliente
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome, apelido ou contato…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            <p className="font-semibold">Erro ao carregar clientes</p>
            <p className="mt-1 font-mono text-xs">{error}</p>
            <button onClick={reload} className="mt-2 text-xs underline">Tentar novamente</button>
          </div>
        ) : clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-10 w-10 text-slate-200 mb-3" />
            <p className="text-slate-400 text-sm">Nenhum cliente encontrado</p>
            <button onClick={() => setModalClient(null)} className="mt-3 text-xs text-emerald-600 hover:underline">+ Cadastrar primeiro cliente</button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Cliente', 'Contato', 'R$/cm²', 'Substratos', 'Espessuras', 'Tintas', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((client, i) => (
                  <tr key={client.id}
                    className={[
                      'transition-colors hover:bg-slate-50',
                      i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40',
                      !client.active ? 'opacity-50' : '',
                    ].join(' ')}>

                    {/* Cliente */}
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                          {client.nickname?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 leading-tight">{client.nickname}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[160px]">{client.company_name}</p>
                          {client.unit_city && (
                            <p className="flex items-center gap-0.5 text-xs text-slate-400 mt-0.5">
                              <MapPin className="h-3 w-3" />{client.unit_city}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Contato */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5 text-xs text-slate-500">
                        {client.contact_name && <p className="font-medium text-slate-700">{client.contact_name}</p>}
                        {client.email && (
                          <p className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-300" />
                            <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
                          </p>
                        )}
                        {client.phone && (
                          <p className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-slate-300" />
                            {client.phone}
                          </p>
                        )}
                        {!client.contact_name && !client.email && !client.phone && <span className="text-slate-300">—</span>}
                      </div>
                    </td>

                    {/* Preço */}
                    <td className="px-4 py-3 text-xs font-mono text-slate-700 whitespace-nowrap">
                      {client.price_per_cm2 != null
                        ? `R$ ${Number(client.price_per_cm2).toFixed(4)}`
                        : <span className="text-slate-300">—</span>}
                    </td>

                    {/* Substratos */}
                    <td className="px-4 py-3">
                      <TechBadges items={client.substrates} color="bg-blue-50 text-blue-700" />
                    </td>

                    {/* Espessuras */}
                    <td className="px-4 py-3">
                      <TechBadges items={client.plate_thicknesses} color="bg-violet-50 text-violet-700" />
                    </td>

                    {/* Tintas */}
                    <td className="px-4 py-3">
                      <TechBadges items={client.ink_types} color="bg-amber-50 text-amber-700" />
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setModalClient(client)}
                          title="Editar"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => toggleActive(client.id, !client.active)}
                          title={client.active ? 'Desativar' : 'Reativar'}
                          className={[
                            'rounded-lg p-1.5 transition-colors',
                            client.active
                              ? 'text-slate-400 hover:bg-red-50 hover:text-red-500'
                              : 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700',
                          ].join(' ')}>
                          {client.active ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalClient !== undefined && (
        <ClientFormModal
          client={modalClient}
          onClose={() => setModalClient(undefined)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}
