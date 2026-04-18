import { useFieldArray, useFormContext } from 'react-hook-form'
import { Plus, Trash2 } from 'lucide-react'
import type { OrderColorInput } from '../utils/schemas'

interface FormValues {
  colors: OrderColorInput[]
}

const COMMON_COLORS = ['Cyan', 'Magenta', 'Amarelo', 'Preto', 'Pantone', 'Branco', 'Prata', 'Verniz']

export function ColorsForm({ pricePerCm2 }: { pricePerCm2?: number | null }) {
  const { register, watch, control, formState: { errors } } = useFormContext<FormValues>()
  const { fields, append, remove } = useFieldArray({ control, name: 'colors' })
  const colors = watch('colors') ?? []

  const totalArea = colors.reduce((sum, c) => {
    const area = (Number(c.width_cm) || 0) * (Number(c.height_cm) || 0) * (Number(c.num_sets) || 1)
    return sum + area
  }, 0)
  const totalPrice = pricePerCm2 ? totalArea * pricePerCm2 : null

  function addColor(name = '') {
    append({ color_name: name, width_cm: 0, height_cm: 0, num_sets: 1 })
  }

  return (
    <div className="space-y-4">
      {/* Quick add chips */}
      <div className="flex flex-wrap gap-2">
        {COMMON_COLORS.map(c => (
          <button
            key={c}
            type="button"
            onClick={() => addColor(c)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 hover:border-emerald-400 hover:text-emerald-700 transition-colors"
          >
            + {c}
          </button>
        ))}
        <button
          type="button"
          onClick={() => addColor()}
          className="rounded-full border border-dashed border-slate-300 bg-white px-3 py-1 text-xs text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-colors"
        >
          + Outra cor
        </button>
      </div>

      {/* Color rows */}
      {fields.length > 0 && (
        <div className="space-y-2">
          {/* Header */}
          <div className="grid grid-cols-[1fr_90px_90px_60px_auto] gap-2 px-1">
            {['Cor', 'Larg. (cm)', 'Alt. (cm)', 'Jogos', ''].map(h => (
              <span key={h} className="text-xs font-medium text-slate-400">{h}</span>
            ))}
          </div>

          {fields.map((field, i) => {
            const w = Number(colors[i]?.width_cm) || 0
            const h = Number(colors[i]?.height_cm) || 0
            const s = Number(colors[i]?.num_sets) || 1
            const area = w * h * s

            return (
              <div key={field.id} className="grid grid-cols-[1fr_90px_90px_60px_auto] gap-2 items-start">
                <div>
                  <input
                    {...register(`colors.${i}.color_name`)}
                    placeholder="Nome da cor"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  {(errors.colors as any)?.[i]?.color_name && (
                    <p className="mt-0.5 text-xs text-red-600">{(errors.colors as any)[i].color_name.message}</p>
                  )}
                </div>
                <input
                  {...register(`colors.${i}.width_cm`)}
                  type="number" step="0.01" placeholder="0.00"
                  className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  {...register(`colors.${i}.height_cm`)}
                  type="number" step="0.01" placeholder="0.00"
                  className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  {...register(`colors.${i}.num_sets`)}
                  type="number" placeholder="1"
                  className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="mt-1 rounded-lg p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                {/* Area hint */}
                {area > 0 && (
                  <div className="col-span-5 px-1 -mt-1">
                    <span className="text-xs text-slate-400">
                      {area.toFixed(2)} cm²
                      {pricePerCm2 ? ` · R$ ${(area * pricePerCm2).toFixed(2)}` : ''}
                    </span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {fields.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 py-8 text-center">
          <Plus className="h-6 w-6 text-slate-300 mb-2" />
          <p className="text-sm text-slate-400">Adicione as cores da OS</p>
          <p className="text-xs text-slate-300 mt-0.5">Use os chips acima ou o botão "Outra cor"</p>
        </div>
      )}

      {/* Totals */}
      {fields.length > 0 && (
        <div className="flex justify-end gap-6 text-sm pt-1 border-t border-slate-100">
          <span className="text-slate-500">
            Total área: <span className="font-semibold text-slate-800">{totalArea.toFixed(2)} cm²</span>
          </span>
          {totalPrice != null && (
            <span className="text-slate-500">
              Total cores: <span className="font-semibold text-emerald-700">R$ {totalPrice.toFixed(2)}</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
