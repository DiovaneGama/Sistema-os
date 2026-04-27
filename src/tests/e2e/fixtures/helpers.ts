import { Page, expect } from '@playwright/test'

/**
 * Navega para /production, filtra pela OS informada e aguarda carregar.
 */
export async function goToOrder(page: Page, orderNumber: string) {
  await page.goto('/production')
  await page.waitForLoadState('networkidle')

  // Usa a barra de busca para mostrar só a OS desejada
  const searchInput = page.locator('input[placeholder*="buscar" i], input[placeholder*="Buscar" i]').first()
  await expect(searchInput).toBeVisible({ timeout: 8_000 })
  await searchInput.fill(orderNumber)
  await page.waitForTimeout(600) // debounce da busca
}

/**
 * Com a fila já filtrada para uma OS, clica no botão de avançar status.
 * Para OS em 'tratamento', isso abre o PricingGateModal.
 */
export async function openPricingModal(page: Page, orderNumber: string) {
  // Após filtrar, deve restar apenas o card desta OS — pega o único botão Avançar
  const advanceBtn = page.locator('button[title*="Avan"]').first()
  await expect(advanceBtn).toBeVisible({ timeout: 10_000 })
  await advanceBtn.click()

  // Aguarda o modal abrir (título: "Precificar OS")
  await expect(page.locator('text=Precificar OS')).toBeVisible({ timeout: 10_000 })
  // Aguarda o loading interno do modal terminar
  await page.waitForTimeout(2_000)
}

/** Aguarda o modal fechar como sinal de sucesso */
export async function waitForSave(page: Page) {
  await expect(page.locator('text=Precificar OS')).toBeHidden({ timeout: 10_000 })
}
