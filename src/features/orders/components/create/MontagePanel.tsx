import { useState, useEffect } from 'react'
import { ChevronUp, ChevronDown, Copy, Check } from 'lucide-react'
import { PI_OPTIONS } from '../../utils/schemas'
import { calcMontage, calcGapReps } from '../../hooks/useCreateOrder'

const REDUCTION_OPTIONS: Record<string, { label: string; value: number }[]> = {
  '1.14': [
    { label: '6.38 mm (padrão)', value: 6.38 },
    { label: '6.22 mm', value: 6.22 },
  ],
  '1.70': [
    { label: '9.0 mm (padrão)', value: 9.0 },
    { label: '9.5 mm', value: 9.5 },
    { label: '10.0 mm', value: 10.0 },
  ],
}

export interface MontageValues {
  gear_z: number
  pi_value: number
  reduction_mm: number
  distortion_pct: number
  pistas: number
  repeticoes: number
  gap_pistas: number
  altura_faca: number
  largura_faca: number
  largura_material: number
}

interface Props {
  visible: boolean
  plateThickness: string
  onChange: (v: MontageValues) => void
}

function NumInput({ label, value, onChange, placeholder, step = 0.1, required = false, error = false }: {
  label: string
  value: number | ''
  onChange: (v: number | '') => void
  placeholder?: string
  step?: number
  required?: boolean
  error?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type="number"
        min={0}
        step={step}
        value={value === '' ? '' : value}
        onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        placeholder={placeholder}
        className={['w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
          error ? 'border-red-300 bg-red-50' : 'border-slate-200'].join(' ')}
      />
      {error && <p className="mt-1 text-xs text-red-500">Campo obrigatório</p>}
    </div>
  )
}

function Spinner({ label, value, onChange, min = 1, step = 1, disabled = false, error = false, required = false }: {
  label: string; value: number; onChange: (v: number) => void
  min?: number; step?: number; disabled?: boolean; error?: boolean; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex items-center">
        <button type="button" onClick={() => onChange(Math.max(min, value - step))}
          disabled={disabled || value <= min}
          className={['rounded-l-lg border px-2 py-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors',
            error ? 'border-red-300' : 'border-slate-200'].join(' ')}>
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <input type="number" value={value} min={min} step={step} disabled={disabled}
          onChange={e => onChange(Math.max(min, Number(e.target.value)))}
          className={['w-14 border-y px-2 py-2 text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50',
            error ? 'border-red-300' : 'border-slate-200'].join(' ')} />
        <button type="button" onClick={() => onChange(value + step)} disabled={disabled}
          className={['rounded-r-lg border px-2 py-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40 transition-colors',
            error ? 'border-red-300' : 'border-slate-200'].join(' ')}>
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">Obrigatório quando pistas &gt; 1</p>}
    </div>
  )
}

function buildClipboardString(
  z: number, piValue: number, plateThickness: string, reductionMm: number,
  larguraFaca: number, alturaFaca: number, larguraMaterial: number,
  pistas: number, repeticoes: number, gapPistas: number,
): string {
  const foto114 = plateThickness === '1.14' ? 1 : 0
  return [
    'STEPREPEAT',
    `Z=${z}`,
    `PI=${piValue}`,
    `FOTO114=${foto114}`,
    `REDUCAO=${reductionMm}`,
    `LARGURA=${larguraFaca}`,
    `ALTURA=${alturaFaca}`,
    `MATERIAL=${larguraMaterial || 0}`,
    `PISTAS=${pistas}`,
    `REPETICOES=${repeticoes}`,
    `GAP_PISTAS=${gapPistas}`,
  ].join('|')
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">{children}</p>
}

function ResultRow({ label, value, color = 'text-slate-700' }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-slate-100 last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={['text-xs font-mono font-semibold', color].join(' ')}>{value}</span>
    </div>
  )
}

export function MontagePanel({ visible, plateThickness, onChange }: Props) {
  const [z, setZ] = useState<number | ''>('')
  const [piValue, setPiValue] = useState(3.14159)
  const [reductionMm, setReductionMm] = useState<number>(0)
  const [pistas, setPistas] = useState(1)
  const [repeticoes, setRepeticoes] = useState(1)
  const [gapPistas, setGapPistas] = useState(0)
  const [alturaFaca, setAlturaFaca] = useState<number | ''>('')
  const [larguraFaca, setLarguraFaca] = useState<number | ''>('')
  const [larguraMaterial, setLarguraMaterial] = useState<number | ''>('')
  const [touched, setTouched] = useState(false)
  const [copied, setCopied] = useState(false)

  const reductionOptions = REDUCTION_OPTIONS[plateThickness] ?? []

  // Erros de validação (somente campos obrigatórios)
  const errZ = touched && (!z || Number(z) <= 0)
  const errAlturaFaca = touched && (!alturaFaca || Number(alturaFaca) <= 0)
  const errLarguraFaca = touched && (!larguraFaca || Number(larguraFaca) <= 0)
  const errGapPistas = pistas > 1 && gapPistas <= 0

  useEffect(() => {
    if (reductionOptions.length > 0) setReductionMm(reductionOptions[0].value)
  }, [plateThickness])

  useEffect(() => {
    if (!z || Number(z) <= 0 || !reductionMm) return
    const { passo } = calcMontage(Number(z), piValue, reductionMm)
    onChange({
      gear_z: Number(z), pi_value: piValue, reduction_mm: reductionMm,
      distortion_pct: passo,
      pistas, repeticoes, gap_pistas: gapPistas,
      altura_faca: Number(alturaFaca) || 0,
      largura_faca: Number(larguraFaca) || 0,
      largura_material: Number(larguraMaterial) || 0,
    })
  }, [z, piValue, reductionMm, pistas, repeticoes, gapPistas, alturaFaca, larguraFaca, larguraMaterial])

  const { desenvolvimento, passo } = (z && Number(z) > 0 && reductionMm)
    ? calcMontage(Number(z), piValue, reductionMm)
    : { desenvolvimento: 0, passo: 0 }

  const alturaFacaNum = Number(alturaFaca) || 0
  const gapReps = (desenvolvimento > 0 && repeticoes > 0 && alturaFacaNum > 0)
    ? calcGapReps(desenvolvimento, repeticoes, alturaFacaNum)
    : null

  const showResults = !!(z && Number(z) > 0 && reductionMm > 0)

  if (!visible) return null

  return (
    <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-5"
      onBlur={() => setTouched(true)}>
      <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <span className="text-emerald-600">⚙</span> Dados para Montagem
      </h2>

      {/* ── DIMENSÕES ── */}
      <div>
        <SectionLabel>Dimensões</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          {/* Z */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Z — Nº de Dentes <span className="text-red-500">*</span>
            </label>
            <input
              type="number" min={1} step={1}
              value={z === '' ? '' : z}
              onBlur={() => setTouched(true)}
              onChange={e => setZ(e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value)))}
              placeholder="Ex: 72"
              className={['w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500',
                errZ ? 'border-red-300 bg-red-50' : 'border-slate-200'].join(' ')}
            />
            {errZ && <p className="mt-1 text-xs text-red-500">Campo obrigatório</p>}
          </div>

          {/* Pi */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Constante Pi <span className="text-red-500">*</span></label>
            <div className="flex gap-2">
              {PI_OPTIONS.map(pi => (
                <button key={pi.value} type="button" onClick={() => setPiValue(pi.value)}
                  className={['flex-1 rounded-lg border py-2 text-xs font-medium transition-colors',
                    piValue === pi.value
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400',
                  ].join(' ')}>
                  {pi.label}
                </button>
              ))}
            </div>
          </div>

          <NumInput
            label="Largura da Faca (mm)" required
            value={larguraFaca} onChange={setLarguraFaca}
            placeholder="Ex: 120.00" error={errLarguraFaca}
          />
          <NumInput
            label="Altura da Faca (mm)" required
            value={alturaFaca} onChange={setAlturaFaca}
            placeholder="Ex: 54.27" error={errAlturaFaca}
          />
          <div className="col-span-2">
            <NumInput
              label="Largura do Material (mm)"
              value={larguraMaterial} onChange={setLarguraMaterial}
              placeholder="Ex: 330.00"
            />
          </div>
        </div>
      </div>

      {/* ── ESPAÇAMENTO ── */}
      <div>
        <SectionLabel>Espaçamento</SectionLabel>
        <div className="grid grid-cols-3 gap-4">
          <Spinner label="Qtd. Pistas" required value={pistas}
            onChange={v => { setPistas(v); if (v === 1) setGapPistas(0) }} />
          <Spinner label="Qtd. Repetições" required value={repeticoes} onChange={setRepeticoes} />
          <Spinner
            label="Gap entre Pistas (mm)"
            value={gapPistas} onChange={setGapPistas}
            min={0} step={0.5}
            disabled={pistas <= 1}
            error={errGapPistas}
            required={pistas > 1}
          />
        </div>
      </div>

      {/* ── REDUÇÃO ── */}
      <div>
        <SectionLabel>Redução (espessura {plateThickness || '—'} mm) <span className="text-red-500 normal-case font-normal">*</span></SectionLabel>
        <div className="flex gap-2 flex-wrap">
          {reductionOptions.length === 0 ? (
            <span className="text-xs text-slate-400">Selecione a espessura no Bloco 3</span>
          ) : reductionOptions.map(r => (
            <button key={r.value} type="button" onClick={() => setReductionMm(r.value)}
              className={['rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                reductionMm === r.value
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400',
              ].join(' ')}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── RESULTADOS ── */}
      {showResults && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resultados</p>
            {Number(larguraFaca) > 0 && alturaFacaNum > 0 && (
              <button
                type="button"
                onClick={() => {
                  const str = buildClipboardString(
                    Number(z), piValue, plateThickness, reductionMm,
                    Number(larguraFaca), alturaFacaNum, Number(larguraMaterial) || 0,
                    pistas, repeticoes, gapPistas,
                  )
                  navigator.clipboard.writeText(str).then(() => {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  })
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-emerald-400 hover:text-emerald-700 transition-colors"
              >
                {copied
                  ? <><Check className="h-3.5 w-3.5 text-emerald-600" /> Copiado!</>
                  : <><Copy className="h-3.5 w-3.5" /> Copiar para CorelDRAW</>
                }
              </button>
            )}
          </div>
          <div className="rounded-lg bg-white border border-slate-200 p-3">
            <ResultRow label="Desenvolvimento" value={`${desenvolvimento.toFixed(3)} mm`} />
            <ResultRow label="Redução" value={`${reductionMm} mm`} />
            <ResultRow
              label="Passo (Distorção)"
              value={`${passo.toFixed(2)} mm`}
              color={passo > 0 ? 'text-emerald-600' : 'text-red-500'}
            />
            {gapReps !== null ? (
              <>
                <ResultRow
                  label="Gap entre Repetições"
                  value={`${gapReps.toFixed(2)} mm${gapReps < 0 ? ' ⚠ Sobreposição!' : ''}`}
                  color={gapReps < 0 ? 'text-red-600' : 'text-amber-600'}
                />
                {gapReps >= 0 && gapReps < 1 && (
                  <div className="mt-1 mb-1 rounded bg-amber-50 border border-amber-200 px-2 py-1 text-xs text-amber-700">
                    ⚠ Gap entre repetições menor que 1 mm — verifique as medidas.
                  </div>
                )}
              </>
            ) : repeticoes > 1 ? (
              <div className="py-1 text-xs text-slate-400 italic">
                Informe a altura da faca para calcular o gap entre repetições.
              </div>
            ) : null}
            {pistas > 1 && gapPistas > 0 && (
              <ResultRow label="Gap entre Pistas" value={`${gapPistas} mm`} color="text-amber-600" />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
