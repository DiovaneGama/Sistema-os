---
paths:
  - "src/features/orders/**"
  - "src/features/quotes/**"
---

# Regras de Formulários em Cascata — Sistema ManOS

> Padrões validados em produção durante implementação da US-14 (CreateOrderPage).
> Referência completa: `@Gama/02_Projetos/Expertises_Sistema-os/Padroes_Formulario_Cascata.md`
> Rascunho persistido no banco (draft por usuário, restore, promoção): `@Gama/02_Projetos/Expertises_Sistema-os/Padroes_Rascunho_OS.md`

## Estrutura do Formulário em Cascata (US-14)
```
CreateOrderPage (estado pai — controla openBlock e maxBlock)
├── Block1_Identification → onValidated → setBlock1 + advanceTo(2)
├── Block2_Machine        → onValidated → setBlock2 + advanceTo(3)
│                         → onInvalidated → setBlock2(null) + setBlock3(null)
├── Block3_Cliche         → onValidated → setBlock3 + advanceTo(4)
└── Block4_Colors         → onValidated → setColorsValidated(true)
```

## Padrões Obrigatórios

### 1. validatedRef — Evitar disparo duplo de onValidated
```ts
const validatedRef = useRef(false)
useEffect(() => {
  const ok = !!campo1 && !!campo2
  if (ok && !validatedRef.current) {
    validatedRef.current = true
    onValidatedRef.current(getValues())
  } else if (!ok) {
    validatedRef.current = false
  }
}, [campo1, campo2])
```

### 2. onValidatedRef — Evitar stale closure em callbacks do pai
```ts
const onValidatedRef = useRef(onValidated)
useEffect(() => { onValidatedRef.current = onValidated }, [onValidated])
```

### 3. Watch-based validation (NÃO usar isValid como dep de useEffect)
```ts
const campo1 = watch('campo1')
const campo2 = watch('campo2')
// usar campo1, campo2 como deps — não formState.isValid
```

### 4. Reset cascata ao trocar seleção pai
```ts
// Resetar filhos ANTES de setar novo valor
setValue('campo_filho', '' as any, { shouldValidate: false })
if (novoPai) setValue('campo_filho', novoValor, { shouldValidate: true })
```

### 5. onInvalidated — Comunicar invalidação do filho para o pai
```ts
// No filho, quando condição de bloqueio ativa:
if (bloqueado && validatedRef.current) {
  validatedRef.current = false
  onInvalidated?.()
}
```

## Regras de Negócio do Bloco 2 (Máquina)
- `band_type` é read-only — determinado pela máquina selecionada, não pelo operador
- Banda Larga obrigatório: Cilindro, Passo, Pistas, Repetições
- Banda Estreita opcional: Sentido de Saída (cabeça/pé)
- Montagem + Banda Larga = bloqueado (RN05)
- Substrato: resetar ao trocar máquina (RN07)

## Validação
- Sempre usar Zod + `@hookform/resolvers/zod`
- Schema de validação: arquivo `schema.ts` dentro da feature
- `mode: 'onChange'` no useForm
