import { test, expect } from '@playwright/test'
import { goToOrder, openPricingModal, waitForSave } from './fixtures/helpers'

/**
 * Pré-requisito: deve existir no banco de dev uma OS com:
 *   - service_type = 'montagem'
 *   - band_type = 'estreita'
 *   - status = 'tratamento'
 *   - order_specs preenchidos (gear_z, pi_value, largura_faca_mm, tracks)
 *
 * Defina o número dessa OS em .env.test:
 *   E2E_MONTAGEM_ORDER_NUMBER=10022
 */
const ORDER_NUMBER = process.env.E2E_MONTAGEM_ORDER_NUMBER ?? ''

test.describe('PricingGateModal — Montagem Banda Estreita', () => {
  test.beforeEach(async ({ page }) => {
    if (!ORDER_NUMBER) test.skip(true, 'E2E_MONTAGEM_ORDER_NUMBER não definido no .env.test')
    await goToOrder(page, ORDER_NUMBER)
  })

  test('exibe banner de cálculo automático ao abrir o modal', async ({ page }) => {
    await openPricingModal(page, ORDER_NUMBER)

    await expect(
      page.locator('text=Dimensões calculadas automaticamente da montagem')
    ).toBeVisible()
  })

  test('campos de largura e altura estão pré-preenchidos com valores numéricos', async ({ page }) => {
    await openPricingModal(page, ORDER_NUMBER)

    const inputs = page.locator('table tbody tr:first-child input[type=number]')
    const larguraVal = await inputs.nth(0).inputValue()
    const alturaVal  = await inputs.nth(1).inputValue()

    expect(parseFloat(larguraVal)).toBeGreaterThan(0)
    expect(parseFloat(alturaVal)).toBeGreaterThan(0)
  })

  test('campos de dimensão têm fundo verde (autoFromMontage)', async ({ page }) => {
    await openPricingModal(page, ORDER_NUMBER)

    const largura = page.locator('table tbody tr:first-child input[type=number]').nth(0)
    await expect(largura).toHaveClass(/bg-emerald-50/)
  })

  test('editar dimensão manualmente remove o fundo verde', async ({ page }) => {
    await openPricingModal(page, ORDER_NUMBER)

    const largura = page.locator('table tbody tr:first-child input[type=number]').nth(0)
    await largura.fill('15')

    await expect(largura).not.toHaveClass(/bg-emerald-50/)
  })

  test('alterar jogos recalcula o preço automaticamente', async ({ page }) => {
    await openPricingModal(page, ORDER_NUMBER)

    const jogos = page.locator('table tbody tr:first-child input[type=number]').nth(2)
    const preco = page.locator('table tbody tr:first-child input[type=number]').nth(3)

    const precoAntes = await preco.inputValue()
    await jogos.fill('2')
    const precoDepois = await preco.inputValue()

    expect(parseFloat(precoDepois)).toBeGreaterThan(parseFloat(precoAntes))
  })

  test('salva precificação e fecha modal', async ({ page }) => {
    await openPricingModal(page, ORDER_NUMBER)

    // O botão de salvar no modo gate é "Salvar Precificação"
    const saveBtn = page.locator('button:has-text("Enviar para Produção"), button:has-text("Aguardar CDI")')
    await expect(saveBtn.first()).toBeEnabled({ timeout: 5_000 })
    await saveBtn.first().click()

    await waitForSave(page)
    await expect(page.locator('text=Precificar OS')).toBeHidden()
  })
})
