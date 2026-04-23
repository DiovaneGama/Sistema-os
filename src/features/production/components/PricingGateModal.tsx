import { useState, useEffect, useMemo } from 'react'
import { X, DollarSign, RefreshCw, Calculator, Copy } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import type { ProductionOrder } from '../hooks/useProductionOrders'

interface ColorRow {
  id: string
  color_name: string
  width_cm: string
  height_cm: string
  num_sets: string
  price: string        // calculado ou editado manualmente
  manualPrice: boolean // se o usuário sobrescreveu o cálculo automático
}

interface Props {
  order: ProductionOrder
  onClose: () => void
  onConfirm: (orderId: string) => Promise<void>
  onConfirmDirect: (orderId: string) => Promise<void>
}

const INPUT = 'w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white tabular-nums'

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function parseNum(s: string): number {
  return parseFloat(s.replace(',', '.')) || 0
}

export function PricingGateModal({ order, onClose, onConfirm, onConfirmDirect }: Props) {
  const [colors,         setColors]         = useState<ColorRow[]>([])
  const [assemblyPrice,  setAssemblyPrice]  = useState('0')
  const [pricePerCm2,    setPricePerCm2]    = useState<number | null>(null)
  const [exemptMinPrice, setExemptMinPrice] = useState(false)
  const [loading,        setLoading]        = useState(true)
  const [saving,         setSaving]         = useState(false)

  const MIN_PRICE = 25

  // Busca cores da OS + price_per_cm2 do cliente
  useEffect(() => {
    async function load() {
      const [colorsRes, clientRes, financialsRes] = await Promise.all([
        (supabase as any)
          .from('order_colors')
          .select('id, color_name, width_cm, height_cm, num_sets, price, sort_order')
          .eq('order_id', order.id)
          .order('sort_order'),
        order.client_id
          ? (supabase as any)
              .from('clients')
              .select('price_per_cm2, exempt_min_price')
              .eq('id', order.client_id)
              .single()
          : Promise.resolve({ data: null }),
        (supabase as any)
          .from('order_financials')
          .select('assembly_price')
          .eq('order_id', order.id)
          .maybeSingle(),
      ])

      const pCm2: number | null = clientRes.data?.price_per_cm2 ?? null
      const exempt: boolean = clientRes.data?.exempt_min_price ?? false
      setPricePerCm2(pCm2)
      setExemptMinPrice(exempt)

      if (financialsRes.data?.assembly_price) {
        setAssemblyPrice(String(financialsRes.data.assembly_price))
      }

      const applyMinLocal = (price: number) => exempt ? price : Math.max(price, MIN_PRICE)

      const rows: ColorRow[] = (colorsRes.data ?? []).map((c: any) => {
        const w    = c.width_cm  ?? 0
        const h    = c.height_cm ?? 0
        const sets = c.num_sets  ?? 1
        const area = w * h * sets
        const calc = pCm2 && area > 0 ? applyMinLocal(area * pCm2) : (c.price ?? 0)
        return {
          id:          c.id,
          color_name:  c.color_name,
          width_cm:    w > 0    ? String(w)    : '',
          height_cm:   h > 0    ? String(h)    : '',
          num_sets:    String(sets),
          price:       c.price != null ? String(c.price) : (calc > 0 ? calc.toFixed(2) : ''),
          manualPrice: c.price != null && pCm2 != null,
        }
      })
      setColors(rows)
      setLoading(false)
    }
    load()
  }, [order.id, order.client_id])

  function applyMin(price: number): number {
    return exemptMinPrice ? price : Math.max(price, MIN_PRICE)
  }

  function updateColor(index: number, field: keyof ColorRow, value: string) {
    setColors(prev => {
      const next = [...prev]
      const row  = { ...next[index], [field]: value }

      if (['width_cm', 'height_cm', 'num_sets'].includes(field) && !row.manualPrice && pricePerCm2) {
        const w    = parseNum(row.width_cm)
        const h    = parseNum(row.height_cm)
        const sets = parseNum(row.num_sets) || 1
        const area = w * h * sets
        const calc = area > 0 ? applyMin(area * pricePerCm2) : 0
        row.price  = calc > 0 ? calc.toFixed(2) : ''
      }

      if (field === 'price') row.manualPrice = true

      next[index] = row
      return next
    })
  }

  // Valida valor numérico não-negativo em BRL (aceita vírgula ou ponto como decimal)
  function sanitizeDecimal(raw: string): string {
    const normalized = raw.replace(',', '.')
    if (normalized === '' || normalized === '-') return ''
    const n = parseFloat(normalized)
    if (isNaN(n) || n < 0) return ''
    return raw
  }

  function handleDimensionChange(index: number, field: 'width_cm' | 'height_cm', raw: string) {
    const sanitized = sanitizeDecimal(raw)
    if (sanitized !== null) updateColor(index, field, raw.replace(',', '.'))
  }

  function handleSetsChange(index: number, raw: string) {
    const n = parseInt(raw)
    if (raw === '' || (!isNaN(n) && n >= 1)) updateColor(index, 'num_sets', raw)
  }

  function handlePriceChange(index: number, raw: string) {
    const sanitized = sanitizeDecimal(raw)
    if (sanitized !== null) updateColor(index, 'price', raw.replace(',', '.'))
  }

  // Replica largura, altura e jogos de uma linha para todas as demais (recalcula preços)
  function replicateRow(sourceIndex: number) {
    const src = colors[sourceIndex]
    setColors(prev => prev.map((row, i) => {
      if (i === sourceIndex) return row
      const updated = {
        ...row,
        width_cm: src.width_cm,
        height_cm: src.height_cm,
        num_sets: src.num_sets,
        manualPrice: false,
      }
      if (pricePerCm2) {
        const w    = parseNum(src.width_cm)
        const h    = parseNum(src.height_cm)
        const sets = parseNum(src.num_sets) || 1
        const area = w * h * sets
        const calc = area > 0 ? applyMin(area * pricePerCm2) : 0
        updated.price = calc > 0 ? calc.toFixed(2) : ''
      }
      return updated
    }))
  }

  function resetPrice(index: number) {
    if (!pricePerCm2) return
    setColors(prev => {
      const next = [...prev]
      const row  = { ...next[index] }
      const w    = parseNum(row.width_cm)
      const h    = parseNum(row.height_cm)
      const sets = parseNum(row.num_sets) || 1
      const area = w * h * sets
      const calc = area > 0 ? applyMin(area * pricePerCm2) : 0
      row.price       = calc > 0 ? calc.toFixed(2) : ''
      row.manualPrice = false
      next[index]     = row
      return next
    })
  }

  const colorsTotal = useMemo(
    () => colors.reduce((s, c) => s + parseNum(c.price), 0),
    [colors]
  )
  const total = colorsTotal + parseNum(assemblyPrice)

  const allFilled = colors.every(c =>
    parseNum(c.width_cm) > 0 &&
    parseNum(c.height_cm) > 0 &&
    parseNum(c.price) > 0
  )

  async function handleConfirm(callback: (orderId: string) => Promise<void>) {
    setSaving(true)
    try {
      for (const c of colors) {
        const { error: colorErr } = await (supabase as any)
          .from('order_colors')
          .update({
            width_cm:  parseNum(c.width_cm)  || null,
            height_cm: parseNum(c.height_cm) || null,
            num_sets:  parseInt(c.num_sets)  || 1,
            price:     parseNum(c.price)     || null,
          })
          .eq('id', c.id)
        if (colorErr) { alert('Erro ao salvar cor: ' + colorErr.message); setSaving(false); return }
      }

      const { error: finErr } = await (supabase as any)
        .from('order_financials')
        .upsert({
          order_id:       order.id,
          assembly_price: parseNum(assemblyPrice),
          colors_total:   colorsTotal,
          total_price:    total,
          updated_at:     new Date().toISOString(),
        }, { onConflict: 'order_id' })
      if (finErr) { alert('Erro ao salvar financeiro: ' + finErr.message); setSaving(false); return }

      await callback(order.id)
    } catch (e: any) {
      alert('Erro inesperado: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                Precificar OS <span className="font-mono text-emerald-600">#{order.order_number}</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {order.client_nickname ?? order.client_name ?? '—'}
                {pricePerCm2 != null && (
                  <span className="ml-2 text-emerald-600 font-medium">
                    · R$ {pricePerCm2.toFixed(4)}/cm²
                  </span>
                )}
                {!exemptMinPrice && (
                  <span className="ml-2 rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    mín. R$ 25,00/cor
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Corpo */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-slate-400 gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          ) : (
            <>
              {/* Tabela de cores */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    {['Cor', 'Largura (cm)', 'Altura (cm)', 'Área (cm²)', 'Jogos', 'Valor (R$)', ''].map(h => (
                      <th key={h} className="pb-2 text-xs font-semibold text-slate-500 text-center first:text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {colors.map((c, i) => {
                    const w    = parseNum(c.width_cm)
                    const h    = parseNum(c.height_cm)
                    const sets = parseNum(c.num_sets) || 1
                    const area = w * h * sets
                    const canReplicate = colors.length > 1 && (w > 0 || h > 0 || sets > 1)
                    return (
                      <tr key={c.id}>
                        <td className="py-2 pr-3 font-medium text-slate-700 whitespace-nowrap">{c.color_name}</td>
                        <td className="py-2 px-1">
                          <input
                            type="number" min={0} step={0.01}
                            value={c.width_cm}
                            onChange={e => handleDimensionChange(i, 'width_cm', e.target.value)}
                            onKeyDown={e => { if (e.key === '-') e.preventDefault() }}
                            className={INPUT}
                            placeholder="0.00"
                          />
                        </td>
                        <td className="py-2 px-1">
                          <input
                            type="number" min={0} step={0.01}
                            value={c.height_cm}
                            onChange={e => handleDimensionChange(i, 'height_cm', e.target.value)}
                            onKeyDown={e => { if (e.key === '-') e.preventDefault() }}
                            className={INPUT}
                            placeholder="0.00"
                          />
                        </td>
                        <td className="py-2 px-1 text-center text-slate-500 tabular-nums text-xs">
                          {area > 0 ? area.toFixed(2) : '—'}
                        </td>
                        <td className="py-2 px-1 w-16">
                          <input
                            type="number" min={1} step={1}
                            value={c.num_sets}
                            onChange={e => handleSetsChange(i, e.target.value)}
                            onKeyDown={e => { if (e.key === '-' || e.key === '.') e.preventDefault() }}
                            className={INPUT}
                          />
                        </td>
                        <td className="py-2 pl-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="number" min={0} step={0.01}
                              value={c.price}
                              onChange={e => handlePriceChange(i, e.target.value)}
                              onKeyDown={e => { if (e.key === '-') e.preventDefault() }}
                              className={[INPUT, c.manualPrice ? 'border-amber-300 bg-amber-50' : ''].join(' ')}
                              placeholder="0.00"
                            />
                            {c.manualPrice && pricePerCm2 && (
                              <button
                                onClick={() => resetPrice(i)}
                                title="Recalcular automaticamente"
                                className="shrink-0 text-slate-300 hover:text-emerald-500 transition-colors"
                              >
                                <Calculator className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="py-2 pl-2">
                          {canReplicate && (
                            <button
                              type="button"
                              onClick={() => replicateRow(i)}
                              title="Replicar dimensões desta cor nas demais"
                              className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-500 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors whitespace-nowrap"
                            >
                              <Copy className="h-3 w-3" />
                              Replicar
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Montagem */}
              <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
                <label className="text-sm font-medium text-slate-600 shrink-0">Valor de Montagem (R$)</label>
                <input
                  type="number" min={0} step={0.01}
                  value={assemblyPrice}
                  onChange={e => {
                    const v = e.target.value.replace(',', '.')
                    if (v === '' || (parseFloat(v) >= 0 && !isNaN(parseFloat(v)))) setAssemblyPrice(v)
                  }}
                  onKeyDown={e => { if (e.key === '-') e.preventDefault() }}
                  className="w-36 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-400 tabular-nums"
                />
                <span className="text-xs text-slate-400">Fechamento, ajuste de arquivo, pré-montagem</span>
              </div>

              {/* Totais */}
              <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-5 py-3 space-y-1.5">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal clichês</span>
                  <span className="font-medium tabular-nums">{fmt(colorsTotal)}</span>
                </div>
                {parseNum(assemblyPrice) > 0 && (
                  <div className="flex justify-between text-sm text-slate-600">
                    <span>Montagem</span>
                    <span className="font-medium tabular-nums">{fmt(parseNum(assemblyPrice))}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-slate-800 border-t border-slate-200 pt-1.5 mt-1.5">
                  <span>Total OS</span>
                  <span className="text-emerald-700 tabular-nums">{fmt(total)}</span>
                </div>
              </div>

              {!allFilled && (
                <p className="mt-3 text-xs text-amber-600 text-center">
                  Preencha dimensões e valor de todas as cores para liberar.
                </p>
              )}
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 shrink-0">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleConfirm(onConfirm)}
              disabled={!allFilled || saving || loading}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Aguardar CDI
            </button>
            <button
              onClick={() => handleConfirm(onConfirmDirect)}
              disabled={!allFilled || saving || loading}
              className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {saving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              Enviar para Produção
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
