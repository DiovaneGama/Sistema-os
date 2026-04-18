import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, UserPlus, Eye, EyeOff } from 'lucide-react'
import type { UserRole } from '../../../types/database'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'sysadmin',      label: 'Sysadmin' },
  { value: 'admin_master',  label: 'Admin Master' },
  { value: 'gestor_pcp',    label: 'Gestor PCP' },
  { value: 'comercial',     label: 'Comercial' },
  { value: 'arte_finalista', label: 'Arte Finalista' },
  { value: 'clicherista',   label: 'Clicherista' },
  { value: 'triador',       label: 'Triador' },
]

const schema = z.object({
  full_name:       z.string().min(3, 'Mínimo 3 caracteres'),
  username:        z.string().min(3, 'Mínimo 3 caracteres').regex(/^[a-z0-9._]+$/, 'Apenas letras minúsculas, números, ponto e underscore'),
  password:        z.string().min(8, 'Mínimo 8 caracteres'),
  confirm_password: z.string(),
  role:            z.enum(['sysadmin', 'admin_master', 'gestor_pcp', 'comercial', 'arte_finalista', 'clicherista', 'triador']),
  daily_os_goal:   z.coerce.number().int().min(1).max(100).default(10),
  commission_rate: z.coerce.number().min(0).max(100).default(1),
}).refine(d => d.password === d.confirm_password, {
  message: 'As senhas não coincidem',
  path: ['confirm_password'],
})

type FormData = z.infer<typeof schema>

interface Props {
  onClose: () => void
  onSave: (data: { full_name: string; username: string; password: string; role: UserRole; daily_os_goal: number; commission_rate: number }) => Promise<{ ok: boolean; error?: string }>
}

export function InviteUserModal({ onClose, onSave }: Props) {
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'arte_finalista', daily_os_goal: 10, commission_rate: 1 },
  })

  const username = watch('username') ?? ''

  async function onSubmit(data: FormData) {
    setServerError(null)
    const result = await onSave({
      full_name: data.full_name,
      username: data.username.toLowerCase(),
      password: data.password,
      role: data.role,
      daily_os_goal: data.daily_os_goal,
      commission_rate: data.commission_rate / 100,
    })
    if (result.ok) {
      onClose()
    } else {
      setServerError(result.error ?? 'Erro ao criar usuário')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <UserPlus className="h-4 w-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-800">Novo Usuário</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-5 py-4 space-y-4">
          {/* Nome Completo */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Nome Completo <span className="text-red-500">*</span>
            </label>
            <input {...register('full_name')} type="text" placeholder="Ex: Maria Silva"
              className={['w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
                errors.full_name ? 'border-red-300' : 'border-slate-200'].join(' ')} />
            {errors.full_name && <p className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>}
          </div>

          {/* Login */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Login (usuário) <span className="text-red-500">*</span>
            </label>
            <input {...register('username')} type="text" placeholder="ex: maria.silva"
              autoCapitalize="none" autoCorrect="off"
              className={['w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
                errors.username ? 'border-red-300' : 'border-slate-200'].join(' ')} />
            {username.length >= 3 && !errors.username && (
              <p className="mt-1 text-xs text-slate-400">
                Login: <span className="font-mono text-slate-600">{username.toLowerCase()}@sistema.local</span>
              </p>
            )}
            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username.message}</p>}
          </div>

          {/* Senha + Confirmar */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Senha <span className="text-red-500">*</span>
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
          </div>

          {/* Papel */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Papel (Role) <span className="text-red-500">*</span>
            </label>
            <select {...register('role')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
              {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Meta + Comissão */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Meta diária (OS/dia)</label>
              <input {...register('daily_os_goal')} type="number" min={1} max={100}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              {errors.daily_os_goal && <p className="mt-1 text-xs text-red-600">{errors.daily_os_goal.message}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Comissão (%)</label>
              <div className="flex items-center gap-1">
                <input {...register('commission_rate')} type="number" min={0} max={100} step={0.01}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <span className="text-xs text-slate-400 shrink-0">%</span>
              </div>
              {errors.commission_rate && <p className="mt-1 text-xs text-red-600">{errors.commission_rate.message}</p>}
            </div>
          </div>

          {serverError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
              {serverError}
            </div>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              <UserPlus className="h-3.5 w-3.5" />
              {isSubmitting ? 'Criando…' : 'Criar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
