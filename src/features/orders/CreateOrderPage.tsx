import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check } from 'lucide-react'
import { Block1_Identification } from './components/create/Block1_Identification'
import { Block2_Machine } from './components/create/Block2_Machine'
import { Block3_Cliche } from './components/create/Block3_Cliche'
import { Block4_Colors } from './components/create/Block4_Colors'
import { MontagePanel, type MontageValues } from './components/create/MontagePanel'
import { NomenclaturePanel } from './components/create/NomenclaturePanel'
import { ConfirmOrderModal } from './components/create/ConfirmOrderModal'
import { useClientProfile, saveCreateOrder, useNextOrderNumber } from './hooks/useCreateOrder'
import type { Block1Input, Block2Input, Block3Input } from './utils/schemas'

type BlockStep = 1 | 2 | 3 | 4

export function CreateOrderPage() {
  const navigate = useNavigate()
  const orderNumber = useNextOrderNumber()

  const [copied, setCopied] = useState(false)

  // Thumbnail
  const [thumbnail, setThumbnail] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  // Dados por bloco
  const [block1, setBlock1] = useState<Block1Input | null>(null)
  const [block2, setBlock2] = useState<Block2Input | null>(null)
  const [block3, setBlock3] = useState<Block3Input | null>(null)
  const [colors, setColors] = useState<string[]>([])
  const [colorsValidated, setColorsValidated] = useState(false)
  const [montage, setMontage] = useState<MontageValues | null>(null)

  // Bloco aberto (accordion) e máximo já alcançado
  const [openBlock, setOpenBlock] = useState<BlockStep>(1)
  const [maxBlock, setMaxBlock] = useState<BlockStep>(1)

  // Modal de confirmação
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const { profile, nickname: clientNickname } = useClientProfile(block1?.client_id ?? null)

  const isMontagem = block1?.service_type === 'montagem'
  const isBandaLarga = block2?.band_type === 'larga'

  const allValidated = !!block1 && !!block2 && !!block3 && colorsValidated
    && (block1.service_type !== 'montagem' || isBandaLarga || !!montage)

  function toggleBlock(n: BlockStep) {
    setOpenBlock(prev => prev === n ? (n > 1 ? (n - 1) as BlockStep : n) : n)
  }

  function advanceTo(n: BlockStep) {
    setOpenBlock(n)
    setMaxBlock(prev => (n > prev ? n : prev))
  }

  const handleBlock1 = useCallback((data: Block1Input) => {
    const isFirst = !block1
    const clientChanged = block1?.client_id !== data.client_id
    if (clientChanged) {
      setBlock2(null)
      setBlock3(null)
      setColors([])
      setColorsValidated(false)
      setMaxBlock(1)
    }
    setBlock1(data)
    if (isFirst || clientChanged) advanceTo(2)
  }, [block1])

  const handleBlock2 = useCallback((data: Block2Input) => {
    if (block2?.target_machine !== data.target_machine) {
      setBlock3(null)
    }
    setBlock2(data)
    advanceTo(3)
  }, [block2?.target_machine])

  const handleBlock3 = useCallback((data: Block3Input) => {
    setBlock3(data)
    advanceTo(4)
  }, [])

  const handleColorsValidated = useCallback(() => {
    setColorsValidated(true)
  }, [])

  async function handleConfirm(operatorId?: string) {
    if (!block1 || !block2 || !block3 || !colorsValidated) return
    setSubmitting(true)
    setGlobalError(null)

    const result = await saveCreateOrder({
      client_id:       block1.client_id,
      operator_id:     operatorId,
      service_type:    block1.service_type,
      service_name:    block1.service_name,
      substrate:       block2.substrate,
      channel:         'balcao',
      is_urgent:       false,
      is_rework:       false,
      band_type:       block2.band_type,
      target_machine:  block2.target_machine,
      exit_direction:  block2.exit_direction,
      has_conjugated:  block2.has_conjugated,
      assembly_type:   block2.assembly_type,
      cilindro_mm:     block2.cilindro_mm,
      passo_larga_mm:  block2.passo_larga_mm,
      pistas_larga:    block2.pistas_larga,
      repeticoes_larga: block2.repeticoes_larga,
      has_cameron:     block2.has_cameron,
      plate_thickness: block3.plate_thickness,
      lineature:       block3.lineature,
      double_tape_mm:  block3.double_tape_mm,
      colors,
      montage: montage && block1.service_type === 'montagem' ? montage : undefined,
      thumbnail_file:  thumbnail,
    })

    setSubmitting(false)
    if (result.ok) {
      navigate('/orders')
    } else {
      setGlobalError(result.error ?? 'Erro ao salvar o pedido.')
      setShowConfirm(false)
    }
  }

  function copyOrderNumber() {
    if (!orderNumber) return
    navigator.clipboard.writeText(orderNumber).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header fixo com número da OS */}
      <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/orders')}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>

        {/* Título alinhado ao conteúdo */}
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Nova OS</p>
          <h1 className="text-2xl font-extrabold text-slate-800 leading-tight">Criar OS</h1>
        </div>

        {/* Número da OS — destacado */}
        <button
          onClick={copyOrderNumber}
          disabled={!orderNumber}
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-5 py-2.5 hover:bg-emerald-50 hover:border-emerald-300 transition-colors group disabled:opacity-40"
        >
          <div className="text-left">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 group-hover:text-emerald-600">Número da OS</p>
            <span className="font-mono text-lg font-extrabold text-slate-800 group-hover:text-emerald-800 leading-tight">
              {orderNumber || '…'}
            </span>
          </div>
          {copied
            ? <Check className="h-4 w-4 text-emerald-600" />
            : <Copy className="h-4 w-4 text-slate-400 group-hover:text-emerald-600" />
          }
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[800px] mx-auto space-y-3">

          {globalError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {globalError}
            </div>
          )}

          <Block1_Identification
            isOpen={openBlock === 1}
            validated={!!block1}
            enabled={maxBlock >= 1}
            thumbnail={thumbnailPreview}
            onToggle={() => toggleBlock(1)}
            onThumbnailChange={(file, preview) => { setThumbnail(file); setThumbnailPreview(preview) }}
            onValidated={handleBlock1}
          />

          <Block2_Machine
            isOpen={openBlock === 2}
            validated={!!block2}
            enabled={maxBlock >= 2}
            profile={profile}
            serviceType={block1?.service_type}
            onToggle={() => toggleBlock(2)}
            onValidated={handleBlock2}
            onInvalidated={() => { setBlock2(null); setBlock3(null) }}
          />

          <Block3_Cliche
            isOpen={openBlock === 3}
            validated={!!block3}
            enabled={maxBlock >= 3}
            profile={profile}
            selectedMachine={block2?.target_machine ?? ''}
            onToggle={() => toggleBlock(3)}
            onValidated={handleBlock3}
          />

          <Block4_Colors
            isOpen={openBlock === 4}
            validated={colorsValidated}
            enabled={maxBlock >= 4}
            colors={colors}
            onToggle={() => toggleBlock(4)}
            onChange={c => { setColors(c); if (c.length === 0) setColorsValidated(false) }}
            onValidated={handleColorsValidated}
          />

          {isMontagem && !isBandaLarga && (
            <MontagePanel
              visible
              plateThickness={block3?.plate_thickness ?? ''}
              onChange={setMontage}
            />
          )}

          <NomenclaturePanel
            orderNumber={orderNumber}
            date={new Date()}
            nickname={clientNickname ?? ''}
            substrate={block2?.substrate ?? ''}
            lineature={block3?.lineature ?? ''}
            thickness={block3?.plate_thickness ?? ''}
            colors={colors}
            serviceName={block1?.service_name ?? ''}
            allBlocksValidated={allValidated}
            isInternalPrint={block2?.is_internal_print}
          />

          {/* Botão final — só aparece quando tudo validado */}
          {allValidated && (
            <div className="flex justify-end pb-8">
              <button
                type="button"
                onClick={() => setShowConfirm(true)}
                className="rounded-lg bg-emerald-600 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
              >
                Revisar e Gerar OS →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmação */}
      {showConfirm && block1 && block2 && block3 && (
        <ConfirmOrderModal
          orderNumber={orderNumber}
          clientNickname={clientNickname ?? block1.client_id}
          block1={block1}
          block2={block2}
          block3={block3}
          colors={colors}
          montage={isMontagem ? montage : null}
          submitting={submitting}
          onEdit={() => setShowConfirm(false)}
          onConfirm={(opId) => handleConfirm(opId)}
        />
      )}
    </div>
  )
}
