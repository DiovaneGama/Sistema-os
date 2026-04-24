import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Check, Save, Loader2 } from 'lucide-react'
import { Block1_Identification } from './components/create/Block1_Identification'
import { Block2_Machine } from './components/create/Block2_Machine'
import { Block3_Cliche } from './components/create/Block3_Cliche'
import { Block4_Colors } from './components/create/Block4_Colors'
import { MontagePanel, type MontageValues } from './components/create/MontagePanel'
import { NomenclaturePanel } from './components/create/NomenclaturePanel'
import { ConfirmOrderModal } from './components/create/ConfirmOrderModal'
import { useClientProfile, saveCreateOrder, useNextOrderNumber } from './hooks/useCreateOrder'
import type { Block1Input, Block2Input, Block3Input } from './utils/schemas'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

type BlockStep = 1 | 2 | 3 | 4

export function CreateOrderPage() {
  const navigate = useNavigate()
  const { profile, loading: authLoading } = useAuth()
  const nextOrderNumber = useNextOrderNumber()

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
  const [noColorProof, setNoColorProof] = useState(false)
  const [montage, setMontage] = useState<MontageValues | null>(null)
  const [networkFilename, setNetworkFilename] = useState<string>('')

  // Bloco aberto (accordion) e máximo já alcançado
  const [openBlock, setOpenBlock] = useState<BlockStep>(1)
  const [maxBlock, setMaxBlock] = useState<BlockStep>(1)

  // Modal de confirmação
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // Rascunho
  const [draftId, setDraftId] = useState<string | null>(null)
  const [draftOrderNumber, setDraftOrderNumber] = useState<string | null>(null)
  const [draftSaved, setDraftSaved] = useState(false)
  const [loadingDraft, setLoadingDraft] = useState(true)
  const [defaultBlock1, setDefaultBlock1] = useState<Partial<Block1Input> | undefined>()
  const [defaultBlock2, setDefaultBlock2] = useState<Partial<Block2Input> | undefined>()
  const [defaultBlock3, setDefaultBlock3] = useState<Partial<Block3Input> | undefined>()
  const [initialClientLabel, setInitialClientLabel] = useState<string | undefined>()
  const orderNumber = draftOrderNumber ?? nextOrderNumber
  const draftIdRef = useRef<string | null>(null)
  const profileRef = useRef(profile)
  useEffect(() => { draftIdRef.current = draftId }, [draftId])
  useEffect(() => { profileRef.current = profile }, [profile])

  // Carrega rascunho existente
  useEffect(() => {
    if (authLoading) return
    if (!profile?.id) { setLoadingDraft(false); return }
    async function load() {
      const { data: order } = await (supabase as any)
        .from('orders')
        .select('id, client_id, order_number')
        .eq('status', 'rascunho')
        .eq('created_by', profile!.id)
        .maybeSingle()

      if (!order) { setLoadingDraft(false); return }

      setDraftId(order.id)
      draftIdRef.current = order.id
      if (order.order_number) setDraftOrderNumber(order.order_number)

      const [{ data: specs }, { data: colorRows }, { data: clientData }] = await Promise.all([
        (supabase as any).from('order_specs').select('*').eq('order_id', order.id).maybeSingle(),
        (supabase as any).from('order_colors').select('color_name').eq('order_id', order.id).order('sort_order'),
        order.client_id
          ? (supabase as any).from('clients').select('nickname, company_name').eq('id', order.client_id).single()
          : Promise.resolve({ data: null }),
      ])
      if (clientData) setInitialClientLabel(`${clientData.nickname} — ${clientData.company_name}`)

      if (specs?.service_name) {
        const b1: Partial<Block1Input> = {
          client_id: order.client_id,
          service_type: specs.service_type ?? '',
          service_name: specs.service_name,
          unit: specs.client_unit ?? '',
        }
        setDefaultBlock1(b1)
        setBlock1(b1 as Block1Input)
        setMaxBlock(prev => Math.max(prev, 2) as BlockStep)
      }
      if (specs?.target_machine) {
        const b2: Partial<Block2Input> = {
          substrate: specs.substrate ?? '',
          band_type: specs.band_type ?? 'estreita',
          target_machine: specs.target_machine,
          exit_direction: specs.exit_direction ?? undefined,
          has_conjugated: specs.has_conjugated ?? false,
          assembly_type: specs.assembly_type ?? undefined,
          cilindro_mm: specs.cilindro_mm ?? undefined,
          passo_larga_mm: specs.passo_larga_mm ?? undefined,
          pistas_larga: specs.pistas_larga ?? undefined,
          repeticoes_larga: specs.repeticoes_larga ?? undefined,
          has_cameron: specs.has_cameron ?? false,
        }
        setDefaultBlock2(b2)
        setBlock2(b2 as Block2Input)
        setMaxBlock(prev => Math.max(prev, 3) as BlockStep)
      }
      if (specs?.plate_thickness) {
        const b3: Partial<Block3Input> = {
          plate_thickness: String(specs.plate_thickness),
          lineature: String(specs.lineature ?? ''),
          double_tape_mm: specs.double_tape_mm ? String(specs.double_tape_mm) : undefined,
        }
        setDefaultBlock3(b3)
        setBlock3(b3 as Block3Input)
        setMaxBlock(prev => Math.max(prev, 4) as BlockStep)
      }
      if (colorRows?.length > 0) {
        const names = (colorRows as any[]).map(r => r.color_name)
        setColors(names)
        setColorsValidated(true)
      }
      if (specs?.no_color_proof) setNoColorProof(true)

      setOpenBlock(1)
      setDraftSaved(true)
      setLoadingDraft(false)
    }
    load()
  }, [profile?.id, authLoading])

  const noColorProofRef = useRef(false)
  useEffect(() => { noColorProofRef.current = noColorProof }, [noColorProof])

  async function saveDraftToDb(
    b1?: Block1Input | null,
    b2?: Block2Input | null,
    b3?: Block3Input | null,
    cols?: string[],
  ) {
    const pid = profileRef.current?.id
    if (!pid || !b1) return
    let id = draftIdRef.current

    if (!id) {
      const { data, error } = await (supabase as any)
        .from('orders')
        .insert({ client_id: b1.client_id, status: 'rascunho', created_by: pid, channel: 'balcao', is_urgent: false, is_rework: false })
        .select('id').single()
      if (error) { console.error('[saveDraftToDb]', error.message); return }
      id = data.id
      setDraftId(id!)
      draftIdRef.current = id!
    } else {
      await (supabase as any).from('orders').update({ client_id: b1.client_id, updated_at: new Date().toISOString() }).eq('id', id)
    }

    const specData: Record<string, unknown> = {
      order_id: id,
      service_type: b1.service_type,
      service_name: b1.service_name,
      client_unit: b1.unit ?? null,
      updated_at: new Date().toISOString(),
    }
    if (b2) Object.assign(specData, {
      substrate: b2.substrate,
      band_type: b2.band_type,
      target_machine: b2.target_machine,
      exit_direction: b2.exit_direction ?? null,
      has_conjugated: b2.has_conjugated ?? false,
      assembly_type: b2.assembly_type ?? null,
      cilindro_mm: b2.cilindro_mm ?? null,
      passo_larga_mm: b2.passo_larga_mm ?? null,
      pistas_larga: b2.pistas_larga ?? null,
      repeticoes_larga: b2.repeticoes_larga ?? null,
      has_cameron: b2.has_cameron ?? false,
    })
    if (b3) Object.assign(specData, {
      plate_thickness: parseFloat(b3.plate_thickness),
      lineature: parseFloat(b3.lineature),
      double_tape_mm: b3.double_tape_mm ? parseFloat(b3.double_tape_mm) : null,
    })
    specData.no_color_proof = noColorProofRef.current
    await (supabase as any).from('order_specs').upsert(specData, { onConflict: 'order_id' })

    if (cols && cols.length > 0) {
      await (supabase as any).from('order_colors').delete().eq('order_id', id)
      await (supabase as any).from('order_colors').insert(
        cols.map((name, i) => ({ order_id: id, color_name: name, sort_order: i, num_sets: 1 }))
      )
    }

    setDraftSaved(true)
  }

  const { profile: clientProfile, nickname: clientNickname } = useClientProfile(block1?.client_id ?? null)

  const isMontagem = block1?.service_type === 'montagem'
  const isBandaLarga = block2?.band_type === 'larga'

  const allValidated = !!block1 && !!block2 && !!block3 && colorsValidated
    && !!thumbnailPreview
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
    saveDraftToDb(data, clientChanged ? null : block2, clientChanged ? null : block3)
  }, [block1, block2, block3])

  const handleBlock2 = useCallback((data: Block2Input) => {
    if (block2?.target_machine !== data.target_machine) {
      setBlock3(null)
    }
    setBlock2(data)
    advanceTo(3)
    saveDraftToDb(block1, data, block2?.target_machine !== data.target_machine ? null : block3)
  }, [block1, block2, block3])

  const handleBlock3 = useCallback((data: Block3Input) => {
    setBlock3(data)
    advanceTo(4)
    saveDraftToDb(block1, block2, data)
  }, [block1, block2])

  const handleColorsValidated = useCallback((validatedColors: string[]) => {
    setColorsValidated(true)
    saveDraftToDb(block1, block2, block3, validatedColors)
  }, [block1, block2, block3])

  async function handleConfirm(operatorId?: string) {
    if (!block1 || !block2 || !block3 || !colorsValidated) return
    setSubmitting(true)
    setGlobalError(null)

    const existingDraftId = draftIdRef.current

    // Se há rascunho, promove ele; senão cria novo
    if (existingDraftId) {
      try {
        // 1. Promove o rascunho para fila_arte
        const { error: orderErr } = await (supabase as any).from('orders').update({
          assigned_to: operatorId ?? null,
          status: 'fila_arte',
          queued_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', existingDraftId)
        if (orderErr) throw new Error(orderErr.message)

        // 2. Upload thumbnail
        if (thumbnail) {
          const ext = thumbnail.name.split('.').pop()
          const path = `thumbnails/${existingDraftId}.${ext}`
          const { error: upErr } = await (supabase as any).storage.from('order-files').upload(path, thumbnail, { upsert: true })
          if (!upErr) {
            const { data: urlData } = (supabase as any).storage.from('order-files').getPublicUrl(path)
            await (supabase as any).from('orders').update({ thumbnail_url: urlData?.publicUrl }).eq('id', existingDraftId)
          }
        }

        // 3. Finaliza specs (montagem + network_filename + no_color_proof)
        const specUpdate: Record<string, unknown> = { no_color_proof: noColorProof, updated_at: new Date().toISOString() }
        if (montage && block1.service_type === 'montagem') {
          Object.assign(specUpdate, {
            gear_z: montage.gear_z, pi_value: montage.pi_value, reduction_mm: montage.reduction_mm,
            distortion_pct: montage.distortion_pct, tracks: montage.pistas, rows: montage.repeticoes,
            gap_tracks_mm: montage.gap_pistas, altura_faca_mm: montage.altura_faca,
            largura_faca_mm: montage.largura_faca, largura_material_mm: montage.largura_material,
          })
        }
        if (networkFilename) specUpdate.network_filename = networkFilename
        await (supabase as any).from('order_specs').update(specUpdate).eq('order_id', existingDraftId)

        navigate('/orders')
      } catch (e: any) {
        setGlobalError(e?.message ?? 'Erro ao salvar o pedido.')
        setShowConfirm(false)
      } finally {
        setSubmitting(false)
      }
    } else {
      // Sem rascunho: fluxo original
      const result = await saveCreateOrder({
        client_id: block1.client_id, operator_id: operatorId,
        service_type: block1.service_type, service_name: block1.service_name,
        client_unit: block1.unit, substrate: block2.substrate,
        channel: 'balcao', is_urgent: false, is_rework: false,
        band_type: block2.band_type, target_machine: block2.target_machine,
        exit_direction: block2.exit_direction, has_conjugated: block2.has_conjugated,
        assembly_type: block2.assembly_type, cilindro_mm: block2.cilindro_mm,
        passo_larga_mm: block2.passo_larga_mm, pistas_larga: block2.pistas_larga,
        repeticoes_larga: block2.repeticoes_larga, has_cameron: block2.has_cameron,
        plate_thickness: block3.plate_thickness, lineature: block3.lineature,
        double_tape_mm: block3.double_tape_mm, colors, no_color_proof: noColorProof,
        montage: montage && block1.service_type === 'montagem' ? montage : undefined,
        thumbnail_file: thumbnail, network_filename: networkFilename || undefined,
      })
      setSubmitting(false)
      if (result.ok) navigate('/orders')
      else { setGlobalError(result.error ?? 'Erro ao salvar o pedido.'); setShowConfirm(false) }
    }
  }

  function copyOrderNumber() {
    if (!orderNumber) return
    navigator.clipboard.writeText(orderNumber).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (loadingDraft) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-400 gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Verificando rascunho...
      </div>
    )
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

        {draftSaved && (
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <Save className="h-3.5 w-3.5" /> Rascunho salvo
          </span>
        )}

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
            defaultValues={defaultBlock1}
            initialClientLabel={initialClientLabel}
            thumbnail={thumbnailPreview}
            onToggle={() => toggleBlock(1)}
            onThumbnailChange={(file, preview) => { setThumbnail(file); setThumbnailPreview(preview) }}
            onValidated={handleBlock1}
          />

          <Block2_Machine
            isOpen={openBlock === 2}
            validated={!!block2}
            enabled={maxBlock >= 2}
            defaultValues={defaultBlock2}
            profile={clientProfile}
            serviceType={block1?.service_type}
            onToggle={() => toggleBlock(2)}
            onValidated={handleBlock2}
            onInvalidated={() => { setBlock2(null); setBlock3(null) }}
          />

          <Block3_Cliche
            isOpen={openBlock === 3}
            validated={!!block3}
            enabled={maxBlock >= 3}
            defaultValues={defaultBlock3}
            profile={clientProfile}
            selectedMachine={block2?.target_machine ?? ''}
            onToggle={() => toggleBlock(3)}
            onValidated={handleBlock3}
          />

          <Block4_Colors
            isOpen={openBlock === 4}
            validated={colorsValidated}
            enabled={maxBlock >= 4}
            colors={colors}
            noColorProof={noColorProof}
            onToggle={() => toggleBlock(4)}
            onChange={c => {
              setColors(c)
              if (c.length === 0) setColorsValidated(false)
              else if (colorsValidated) saveDraftToDb(block1, block2, block3, c)
            }}
            onNoColorProofChange={v => {
              setNoColorProof(v)
              noColorProofRef.current = v
              if (colorsValidated) saveDraftToDb(block1, block2, block3, colors)
            }}
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
            onNetworkNameChange={setNetworkFilename}
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
