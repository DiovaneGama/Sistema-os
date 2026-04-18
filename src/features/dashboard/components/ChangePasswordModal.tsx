import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, KeyRound, Eye, EyeOff } from 'lucide-react'

const schema = z.object({
  password:        z.string().min(8, 'Mínimo 8 caracteres'),
  confirm_password: z.string(),
}).refine(d => d.password === d.confirm_password, {
  message: 'As senhas não coincidem',
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

interface Props {
  targetName: string
  onClose: () => void
  onSave: (password: string) => Promise<{ ok: boolean; error?: string }>
}

export function ChangePasswordModal({ targetName, onClose, onSave }: Props) {
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setServerError(null)
    const result = await onSave(data.password)
    if (result.ok) onClose()
    else setServerError(result.error ?? 'Erro ao alterar senha')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <KeyRound className="h-4 w-4 text-emerald-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">Redefinir Senha</h2>
              <p className="text-xs text-slate-400">{targetName}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Nova Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input {...register('password')} type={showPass ? 'text' : 'password'} placeholder="••••••••"
                className={['w-full rounded-lg border px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
                  errors.password ? 'border-red-300' : 'border-slate-200'].join(' ')} />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute inset-y-0 right-0 px-2.5 text-slate-400 hover:text-slate-600">
                {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Confirmar Senha <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input {...register('confirm_password')} type={showConfirm ? 'text' : 'password'} placeholder="••••••••"
                className={['w-full rounded-lg border px-3 py-2 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
                  errors.confirm_password ? 'border-red-300' : 'border-slate-200'].join(' ')} />
              <button type="button" onClick={() => setShowConfirm(v => !v)}
                className="absolute inset-y-0 right-0 px-2.5 text-slate-400 hover:text-slate-600">
                {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {errors.confirm_password && <p className="mt-1 text-xs text-red-600">{errors.confirm_password.message}</p>}
          </div>

          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {serverError}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              <KeyRound className="h-3.5 w-3.5" />
              {isSubmitting ? 'Salvando…' : 'Salvar Senha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
