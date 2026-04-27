import { test as setup, expect } from '@playwright/test'

const SESSION_FILE = 'src/tests/e2e/.auth/session.json'

/**
 * Roda UMA VEZ antes de todos os testes E2E.
 * Faz login com o usuário de teste e salva a sessão no disco.
 * Os demais testes reutilizam essa sessão — sem precisar logar novamente.
 *
 * Usuário de teste: deve ter role 'arte_finalista' para acessar o PricingGateModal.
 * Configure as variáveis no .env.test:
 *   E2E_USER_EMAIL=arte@teste.com
 *   E2E_USER_PASSWORD=senha123
 */
setup('autenticar usuário de teste', async ({ page }) => {
  const email    = process.env.E2E_USER_EMAIL    ?? ''
  const password = process.env.E2E_USER_PASSWORD ?? ''

  if (!email || !password) {
    throw new Error(
      'Defina E2E_USER_EMAIL e E2E_USER_PASSWORD no arquivo .env.test antes de rodar os testes E2E.'
    )
  }

  await page.goto('/login')
  await page.fill('input[name=username]', email)
  await page.fill('input[name=password]', password)
  await page.click('button[type=submit]')

  // Aguarda redirecionamento pós-login
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 10_000 })
  await expect(page).not.toHaveURL(/login/)

  // Salva cookies + localStorage para reutilizar nos próximos testes
  await page.context().storageState({ path: SESSION_FILE })
})
