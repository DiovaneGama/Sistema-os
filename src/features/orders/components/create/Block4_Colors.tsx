import { useState, useEffect, useRef } from 'react'
import { X, Plus } from 'lucide-react'
import { BlockHeader } from './BlockHeader'
import { BASE_COLORS } from '../../utils/schemas'
import { PANTONE_SUGGESTIONS, getColorHex, PROCESS_COLORS } from '../../utils/pantoneColors'

interface Props {
  isOpen: boolean
  validated: boolean
  enabled: boolean
  colors: string[]
  onToggle: () => void
  onChange: (colors: string[]) => void
  onValidated: (colors: string[]) => void
}

function ColorSwatch({ name, size = 14 }: { name: string; size?: number }) {
  const hex = getColorHex(name)
  if (!hex) return null
  const isWhite = hex === '#FFFFFF'
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: hex,
        border: isWhite ? '1px solid #cbd5e1' : 'none',
        flexShrink: 0,
      }}
    />
  )
}

export function Block4_Colors({ isOpen, validated, enabled, colors, onToggle, onChange, onValidated }: Props) {
  const [customInput, setCustomInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const validatedRef = useRef(false)

  useEffect(() => {
    if (colors.length > 0 && !validatedRef.current) {
      validatedRef.current = true
      onValidated(colors)
    } else if (colors.length === 0) {
      validatedRef.current = false
    }
  }, [colors])

  function toggle(color: string) {
    if (colors.includes(color)) {
      onChange(colors.filter(c => c !== color))
    } else {
      onChange([...colors, color])
    }
  }

  function addCustom(value: string) {
    const trimmed = value.trim()
    if (!trimmed || colors.includes(trimmed)) return
    onChange([...colors, trimmed])
    setCustomInput('')
    setShowSuggestions(false)
  }

  function remove(color: string) {
    onChange(colors.filter(c => c !== color))
  }

  const filteredSuggestions = PANTONE_SUGGESTIONS.filter(p =>
    p.toLowerCase().includes(customInput.toLowerCase()) && !colors.includes(p)
  )

  return (
    <div className={['bg-white rounded-xl border p-5 transition-all', enabled ? 'border-slate-200' : 'border-slate-100 opacity-50 pointer-events-none'].join(' ')}>
      <BlockHeader number={4} title="Cores do Serviço" validated={validated} isOpen={isOpen} onToggle={onToggle} />

      <div className={isOpen ? 'mt-4 space-y-4' : 'hidden'}>
        {/* Cores base */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Cores Base</p>
          <div className="flex flex-wrap gap-2">
            {BASE_COLORS.map(color => {
              const selected = colors.includes(color)
              return (
                <button key={color} type="button" onClick={() => toggle(color)}
                  className={['rounded-full px-3 py-1 text-xs font-medium border transition-all',
                    selected
                      ? 'bg-slate-100 text-slate-400 border-slate-200 opacity-50'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-400',
                  ].join(' ')}>
                  {color}
                </button>
              )
            })}
          </div>
        </div>

        {/* Campo Pantone / Personalizado */}
        <div className="relative">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            Pantone / Personalizado
            <span className="ml-2 font-normal normal-case text-slate-400">ex: P485C, P286U</span>
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={customInput}
              onChange={e => { setCustomInput(e.target.value); setShowSuggestions(true) }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustom(customInput) } }}
              placeholder="P485C, P7524C..."
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button type="button" onClick={() => addCustom(customInput)}
              disabled={!customInput.trim()}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {showSuggestions && customInput.length > 0 && filteredSuggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
              {filteredSuggestions.map(s => (
                <button key={s} type="button"
                  onMouseDown={() => addCustom(s)}
                  className="w-full flex items-center gap-2.5 text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <ColorSwatch name={s} size={16} />
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tags selecionadas com swatch */}
        {colors.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Selecionadas ({colors.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {colors.map(c => (
                <span key={c} className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  <ColorSwatch name={c} size={12} />
                  {c}
                  <button type="button" onClick={() => remove(c)} className="text-slate-400 hover:text-red-500 transition-colors ml-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {colors.length === 0 && (
          <p className="text-xs text-slate-400">Selecione ao menos uma cor para avançar.</p>
        )}
      </div>
    </div>
  )
}
