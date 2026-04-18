import { useState } from 'react'
import { Mail } from 'lucide-react'
import { MOCK_EMAILS } from './data/mockEmails'
import { EmailList } from './components/EmailList'
import { EmailDetail } from './components/EmailDetail'
import { CreateOrderFromEmailModal } from './components/CreateOrderFromEmailModal'
import type { MockEmail, EmailStatus } from './data/mockEmails'

export function TriagePage() {
  const [emails, setEmails] = useState<MockEmail[]>(MOCK_EMAILS)
  const [selected, setSelected] = useState<MockEmail | null>(null)
  const [filterStatus, setFilterStatus] = useState<EmailStatus | 'todos'>('todos')
  const [createModal, setCreateModal] = useState<MockEmail | null>(null)

  function handleStatusChange(id: string, status: EmailStatus) {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, status } : e))
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev)
  }

  function handleCreated(emailId: string) {
    handleStatusChange(emailId, 'convertido')
    setCreateModal(null)
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Painel esquerdo — lista */}
      <div className="w-80 shrink-0 flex flex-col">
        <EmailList
          emails={emails}
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
        />
      </div>

      {/* Painel direito — detalhe */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selected ? (
          <EmailDetail
            email={selected}
            onCreateOrder={email => setCreateModal(email)}
            onStatusChange={handleStatusChange}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 gap-3">
            <Mail className="h-12 w-12 text-slate-200" />
            <p className="text-sm">Selecione um e-mail para visualizar</p>
          </div>
        )}
      </div>

      {/* Modal de criação de OS */}
      {createModal && (
        <CreateOrderFromEmailModal
          email={createModal}
          onClose={() => setCreateModal(null)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
