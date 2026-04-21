import { useState, useEffect, useCallback } from 'react'
import { X, Save, RefreshCw, ClipboardPaste, ImageOff, Plus } from 'lucide-react'
import { useOrderMutations } from '../hooks/useOrders'
import { useClientProfile } from '../hooks/useCreateOrder'
import { ClientSearchInput } from './ClientSearchInput'
import { supabase } from '../../../lib/supabase'
import { BASE_COLORS, SERVICE_TYPES } from '../utils/schemas'
import { PANTONE_SUGGESTIONS, getColorHex } from '../utils/pantoneColors'
import type { OrderDetail } from '../hooks/useOrders'


const INPUT    = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white'
const READONLY = 'w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-600 cursor-default'

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

function ColorSwatch({ name }: { name: string }) {
  const hex = getColorHex(name)
  if (!hex) return null
  return (
    <span style={{
      display: 'inline-block', width: 12, height: 12, borderRadius: '50%',
      backgroundColor: hex, border: hex === '#FFFFFF' ? '1px solid #cbd5e1' : 'none', flexShrink: 0,
    }} />
  )
}

interface Props {
  order: OrderDetail
  onClose: () => void
  onSaved: () => void
}

export function EditOrderModal({ order, onClose, onSaved }: Props) {
  const { updateOrderFields, updateSpecFields, replaceColors } = useOrderMutations()

  // Identificação
  const [briefing,     setBriefing]     = useState(order.briefing ?? '')
  const [serviceType,  setServiceType]  = useState((order.specs as any)?.service_type ?? '')
  const [isUrgent,     setIsUrgent]     = useState(order.is_urgent)
  const [isRework,     setIsRework]     = useState(order.is_rework)

  // Miniatura
  const [thumbFile,    setThumbFile]    = useState<File | null>(null)
  const [thumbPreview, setThumbPreview] = useState<string | null>(order.thumbnail_url)
  const [pasteHint,    setPasteHint]    = useState(false)

  // Cliente + Serviço
  const [clientId,     setClientId]     = useState(order.client_id ?? '')
  const [serviceName,  setServiceName]  = useState(order.specs?.service_name ?? '')

  // Máquina + Clichê
  const [targetMachine, setTargetMachine] = useState(order.specs?.target_machine ?? '')
  const [substrate,     setSubstrate]     = useState(order.specs?.substrate ?? '')
  const [plateTh,       setPlateTh]       = useState(order.specs?.plate_thickness?.toString() ?? '')
  const [lineature,     setLineature]     = useState(order.specs?.lineature?.toString() ?? '')

  // Banda Larga — campos extras
  const specs = order.specs as any
  const [cilindroMm,     setCilindroMm]     = useState(specs?.cilindro_mm?.toString() ?? '')
  const [passoLargaMm,   setPassoLargaMm]   = useState(specs?.passo_larga_mm?.toString() ?? '')
  const [pistasLarga,    setPistasLarga]    = useState(specs?.pistas_larga?.toString() ?? '')
  const [repeticoesLarga,setRepeticoesLarga]= useState(specs?.repeticoes_larga?.toString() ?? '')
  const [hasCameron,     setHasCameron]     = useState<boolean>(specs?.has_cameron ?? false)
  const [hasConjugated,  setHasConjugated]  = useState<boolean>(specs?.has_conjugated ?? false)
  const [assemblyType,   setAssemblyType]   = useState<string>(specs?.assembly_type ?? '')
  const [exitDirection,  setExitDirection]  = useState<string | undefined>(specs?.exit_direction ?? undefined)
  const [noColorProof,   setNoColorProof]   = useState<boolean>(specs?.no_color_proof ?? false)

  // Cores — lista de nomes (pills)
  const [colors,      setColors]      = useState<string[]>(() => order.colors.map(c => c.color_name))
  const [customInput, setCustomInput] = useState('')
  const [showSuggest, setShowSuggest] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  // Perfil técnico do cliente selecionado
  const { profile: clientProfile } = useClientProfile(clientId || null)

  const machine          = clientProfile?.machines.find(m => m.name === targetMachine)
  const bandType         = (machine?.band_type ?? machine?.band_types?.[0] ?? '') as string
  const isLarga          = bandType === 'larga'
  const blockedByMontagem = serviceType === 'montagem' && isLarga
  const thicknesses  = (machine?.plate_thicknesses ?? []).length > 0
    ? (machine?.plate_thicknesses ?? [])
    : (clientProfile?.plate_thicknesses ?? [])
  const lineatures   = machine
    ? (machine.lineature > 0 ? [machine.lineature] : (machine.lineatures ?? []))
    : []

  const oneTh  = thicknesses.length === 1
  const oneLin = lineatures.length  === 1

  // Quando cliente muda: reset máquina e dependentes
  useEffect(() => {
    setTargetMachine('')
    setSubstrate('')
    setPlateTh('')
    setLineature('')
  }, [clientId])

  // Quando máquina muda: auto-fill se única opção, reset substrato
  useEffect(() => {
    if (!machine) return
    setSubstrate('')
    if (thicknesses.length === 1) setPlateTh(thicknesses[0])
    if (lineatures.length  === 1) setLineature(String(lineatures[0]))
  }, [targetMachine])

  // Ctrl+V para miniatura
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (!file) continue
        if (!['image/jpeg', 'image/png'].includes(file.type)) {
          setError('Apenas JPG e PNG são aceitos.')
          return
        }
        setThumbFile(file)
        setThumbPreview(URL.createObjectURL(file))
        setPasteHint(true)
        setTimeout(() => setPasteHint(false), 2000)
        break
      }
    }
  }, [])

  useEffect(() => {
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [handlePaste])

  // Cores helpers
  function toggleColor(name: string) {
    setColors(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name])
  }
  function removeColor(name: string) {
    setColors(prev => prev.filter(c => c !== name))
  }
  function addCustomColor(value: string) {
    const trimmed = value.trim()
    if (!trimmed || colors.includes(trimmed)) return
    setColors(prev => [...prev, trimmed])
    setCustomInput('')
    setShowSuggest(false)
  }

  const filteredSuggestions = PANTONE_SUGGESTIONS.filter(p =>
    p.toLowerCase().includes(customInput.toLowerCase()) && !colors.includes(p)
  )

  // Salvar
  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      // Upload miniatura
      let newThumbUrl = order.thumbnail_url
      if (thumbFile) {
        const ext  = thumbFile.type === 'image/png' ? 'png' : 'jpg'
        const path = `thumbnails/${order.id}.${ext}`
        const { error: upErr } = await (supabase as any).storage
          .from('order-files')
          .upload(path, thumbFile, { upsert: true, contentType: thumbFile.type })
        if (upErr) throw new Error(`Upload: ${upErr.message}`)
        const { data: urlData } = (supabase as any).storage.from('order-files').getPublicUrl(path)
        newThumbUrl = urlData?.publicUrl ?? null
      }

      const r1 = await updateOrderFields(order.id, {
        briefing:      briefing.trim() || null,
        is_urgent:     isUrgent,
        is_rework:     isRework,
        thumbnail_url: newThumbUrl,
        client_id:     clientId || null,
      })
      if (!r1.ok) throw new Error(r1.error)

      if (order.specs) {
        const r2 = await updateSpecFields(order.id, {
          service_name:     serviceName.trim() || null,
          service_type:     serviceType || null,
          target_machine:   targetMachine || null,
          substrate:        substrate || null,
          band_type:        bandType || null,
          plate_thickness:  plateTh   ? parseFloat(plateTh)   : null,
          lineature:        lineature ? parseFloat(lineature)  : null,
          exit_direction:   !isLarga ? (exitDirection || null) : null,
          cilindro_mm:      isLarga ? (cilindroMm ? parseFloat(cilindroMm) : null) : null,
          passo_larga_mm:   isLarga ? (passoLargaMm ? parseFloat(passoLargaMm) : null) : null,
          pistas_larga:     isLarga ? (pistasLarga ? parseInt(pistasLarga) : null) : null,
          repeticoes_larga: isLarga ? (repeticoesLarga ? parseInt(repeticoesLarga) : null) : null,
          has_cameron:      isLarga ? hasCameron : false,
          has_conjugated:   isLarga ? hasConjugated : false,
          assembly_type:    isLarga && hasConjugated ? (assemblyType || null) : null,
          no_color_proof:   noColorProof,
        })
        if (!r2.ok) throw new Error(r2.error)
      }

      const colorPayload = colors.map(name => ({
        color_name: name,
        width_cm:   null,
        height_cm:  null,
        num_sets:   1,
      }))

      const ok = await replaceColors(order.id, colorPayload as any)
      if (!ok) throw new Error('Erro ao salvar cores')

      onSaved()
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Editar OS <span className="font-mono text-emerald-600">#{order.order_number}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Cole a miniatura com Ctrl+V em qualquer lugar</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ── Miniatura + Identificação ─────────────────────────── */}
          <div className="flex gap-5">
            {/* Miniatura */}
            <div className="w-40 shrink-0">
              <Label>Miniatura</Label>
              <div className={[
                'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all h-40',
                pasteHint ? 'border-emerald-400 bg-emerald-50 scale-[1.02]' : 'border-slate-200 bg-slate-50',
              ].join(' ')}>
                {thumbPreview
                  ? <img src={thumbPreview} alt="thumb" className="h-full w-full object-contain rounded-xl p-1" />
                  : <div className="flex flex-col items-center gap-2 text-slate-300">
                      <ImageOff className="h-7 w-7" />
                      <span className="text-xs">Sem imagem</span>
                    </div>
                }
                <div className="absolute bottom-2 left-0 right-0 flex justify-center pointer-events-none">
                  <span className={[
                    'flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-all',
                    pasteHint ? 'bg-emerald-500 text-white' : 'bg-black/25 text-white',
                  ].join(' ')}>
                    <ClipboardPaste className="h-3 w-3" />
                    {pasteHint ? 'Colado!' : 'Ctrl+V'}
                  </span>
                </div>
              </div>
            </div>

            {/* Identificação */}
            <div className="flex-1 space-y-3">
              <div>
                <Label>Tipo de Serviço</Label>
                <select value={serviceType} onChange={e => setServiceType(e.target.value)} className={INPUT}>
                  <option value="">— Selecione —</option>
                  {SERVICE_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <Label>Observações</Label>
                <textarea value={briefing} onChange={e => setBriefing(e.target.value)}
                  rows={3} placeholder="Informações do pedido..."
                  className={`${INPUT} resize-none`} />
              </div>
            </div>
          </div>

          {/* ── Cliente + Serviço ─────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label required>Cliente</Label>
              <ClientSearchInput
                value={clientId}
                onChange={(id) => setClientId(id)}
              />
            </div>
            <div>
              <Label>Nome do Serviço</Label>
              <input type="text" value={serviceName} onChange={e => setServiceName(e.target.value)}
                placeholder="Ex: Rótulo Vinho Tinto" className={INPUT} />
            </div>
          </div>

          {/* ── Máquina + Clichê ─────────────────────────────────── */}
          {order.specs && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Máquina e Clichê</p>
              <div className="grid grid-cols-2 gap-4">
                {/* Máquina */}
                <div>
                  <Label>Máquina Alvo</Label>
                  <select
                    value={targetMachine}
                    onChange={e => setTargetMachine(e.target.value)}
                    disabled={!clientProfile || clientProfile.machines.length === 0}
                    className={`${INPUT} disabled:bg-slate-50 disabled:text-slate-400`}
                  >
                    <option value="">
                      {!clientId ? 'Selecione um cliente' : !clientProfile ? 'Carregando…' : 'Selecione a máquina…'}
                    </option>
                    {(clientProfile?.machines ?? []).map(m => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                  {bandType && (
                    <span className={[
                      'mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
                      isLarga ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600',
                    ].join(' ')}>
                      {isLarga ? 'Banda Larga' : 'Banda Estreita'}
                    </span>
                  )}
                </div>

                {/* Substrato */}
                <div>
                  <Label>Substrato</Label>
                  <select
                    value={substrate}
                    onChange={e => setSubstrate(e.target.value)}
                    disabled={!targetMachine || (machine?.substrates ?? []).length === 0}
                    className={`${INPUT} disabled:bg-slate-50 disabled:text-slate-400`}
                  >
                    <option value="">
                      {!targetMachine ? 'Selecione a máquina' : 'Selecione o substrato…'}
                    </option>
                    {(machine?.substrates ?? []).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Espessura */}
                <div>
                  <Label>Espessura da Chapa</Label>
                  {oneTh ? (
                    <div className={READONLY}>{thicknesses[0]} mm</div>
                  ) : (
                    <select value={plateTh} onChange={e => setPlateTh(e.target.value)}
                      disabled={thicknesses.length === 0}
                      className={`${INPUT} disabled:bg-slate-50 disabled:text-slate-400`}>
                      <option value="">Selecione…</option>
                      {thicknesses.map(t => <option key={t} value={t}>{t} mm</option>)}
                    </select>
                  )}
                </div>

                {/* Lineatura */}
                <div>
                  <Label>Lineatura</Label>
                  {oneLin ? (
                    <div className={READONLY}>{lineatures[0]} lpc</div>
                  ) : (
                    <select value={lineature} onChange={e => setLineature(e.target.value)}
                      disabled={lineatures.length === 0}
                      className={`${INPUT} disabled:bg-slate-50 disabled:text-slate-400`}>
                      <option value="">Selecione…</option>
                      {lineatures.map(l => <option key={l} value={String(l)}>{l} lpc</option>)}
                    </select>
                  )}
                </div>
              </div>

              {/* Sentido de saída — Banda Estreita */}
              {bandType === 'estreita' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium text-slate-500">Sentido de Saída:</span>
                  {(['cabeca', 'pe'] as const).map(dir => (
                    <button key={dir} type="button"
                      onClick={() => setExitDirection(exitDirection === dir ? undefined : dir)}
                      className={[
                        'rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors',
                        exitDirection === dir
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400',
                      ].join(' ')}>
                      {dir === 'cabeca' ? '↑ Cabeça' : '↓ Pé'}
                    </button>
                  ))}
                </div>
              )}

              {/* Dispensa Prova de Cores — válido para qualquer banda */}
              <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide shrink-0">Opcionais</span>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox" checked={noColorProof} onChange={e => setNoColorProof(e.target.checked)}
                    className="accent-emerald-600 h-3.5 w-3.5" />
                  <span className="text-xs text-slate-600">Dispensa Prova de Cores</span>
                </label>
              </div>

              {/* Alerta montagem + banda larga */}
              {blockedByMontagem && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  O serviço <strong>Montagem</strong> não é compatível com máquinas de <strong>Banda Larga</strong>. Selecione uma máquina de Banda Estreita para continuar.
                </div>
              )}

              {/* Campos exclusivos de Banda Larga */}
              {isLarga && (
                <>
                  {/* Opcionais */}
                  <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 flex flex-wrap items-start gap-x-4 gap-y-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide shrink-0 mt-0.5">Opcionais</span>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={hasCameron} onChange={e => setHasCameron(e.target.checked)}
                        className="accent-emerald-600 h-3.5 w-3.5" />
                      <span className="text-xs text-slate-600">Cameron</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input type="checkbox" checked={hasConjugated} onChange={e => setHasConjugated(e.target.checked)}
                        className="accent-emerald-600 h-3.5 w-3.5" />
                      <span className="text-xs text-slate-600">Conjugado</span>
                    </label>
                    {hasConjugated && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-500">Tipo:</span>
                        {([
                          { value: 'boca_boca', label: 'Boca c/ Boca' },
                          { value: 'pe_pe',     label: 'Pé c/ Pé' },
                          { value: 'pe_boca',   label: 'Pé c/ Boca' },
                        ] as const).map(opt => (
                          <label key={opt.value} className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name="assembly_type" value={opt.value}
                              checked={assemblyType === opt.value}
                              onChange={() => setAssemblyType(opt.value)}
                              className="accent-emerald-600 h-3.5 w-3.5" />
                            <span className="text-xs text-slate-600">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cilindro, Passo, Pistas, Repetições */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cilindro (mm)</Label>
                      <input type="number" min={0} step={0.1} placeholder="Ex: 406.40"
                        value={cilindroMm} onChange={e => setCilindroMm(e.target.value)}
                        className={INPUT} />
                    </div>
                    <div>
                      <Label>Passo (mm)</Label>
                      <input type="number" min={0} step={0.01} placeholder="Ex: 203.20"
                        value={passoLargaMm} onChange={e => setPassoLargaMm(e.target.value)}
                        className={INPUT} />
                    </div>
                    <div>
                      <Label>Qtd. Pistas</Label>
                      <input type="number" min={1} step={1} placeholder="Ex: 3"
                        value={pistasLarga} onChange={e => setPistasLarga(e.target.value)}
                        className={INPUT} />
                    </div>
                    <div>
                      <Label>Qtd. Repetições</Label>
                      <input type="number" min={1} step={1} placeholder="Ex: 6"
                        value={repeticoesLarga} onChange={e => setRepeticoesLarga(e.target.value)}
                        className={INPUT} />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Cores ─────────────────────────────────────────────── */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Cores do Serviço</p>

            {/* Cores base */}
            <div>
              <p className="text-xs text-slate-400 mb-1.5">Cores Base</p>
              <div className="flex flex-wrap gap-2">
                {BASE_COLORS.map(color => (
                  <button key={color} type="button" onClick={() => toggleColor(color)}
                    className={[
                      'rounded-full px-3 py-1 text-xs font-medium border transition-all',
                      colors.includes(color)
                        ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-50'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400',
                    ].join(' ')}>
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Pantone / Personalizado */}
            <div className="relative">
              <p className="text-xs text-slate-400 mb-1.5">
                Pantone / Personalizado
                <span className="ml-1 font-normal text-slate-300">ex: P485C, P286U</span>
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={e => { setCustomInput(e.target.value); setShowSuggest(true) }}
                  onFocus={() => setShowSuggest(true)}
                  onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomColor(customInput) } }}
                  placeholder="P485C..."
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button type="button" onClick={() => addCustomColor(customInput)} disabled={!customInput.trim()}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              {showSuggest && customInput.length > 0 && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-40 overflow-y-auto">
                  {filteredSuggestions.map(s => (
                    <button key={s} type="button" onMouseDown={() => addCustomColor(s)}
                      className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                      <ColorSwatch name={s} />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pills selecionadas */}
            {colors.length > 0 && (
              <div>
                <p className="text-xs text-slate-400 mb-1.5">Selecionadas ({colors.length})</p>
                <div className="flex flex-wrap gap-2">
                  {colors.map(c => (
                    <span key={c} className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      <ColorSwatch name={c} />
                      {c}
                      <button type="button" onClick={() => removeColor(c)}
                        className="text-slate-400 hover:text-red-500 transition-colors ml-0.5">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-slate-100 px-6 py-4 flex justify-end gap-2">
          <button onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
