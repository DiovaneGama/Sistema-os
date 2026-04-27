import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './src/tests/e2e',
  fullyParallel: false,       // testes de UI rodam sequencialmente para evitar conflitos no banco
  retries: 1,                 // 1 retry em CI para flakiness de rede
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL:           'http://localhost:5173',
    headless:          false,  // false = vê o browser; mude para true em CI
    screenshot:        'only-on-failure',
    video:             'retain-on-failure',
    trace:             'on-first-retry',
    actionTimeout:     10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: 'setup',
      testMatch: '**/auth.setup.ts',  // roda login e salva sessão antes dos testes
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'src/tests/e2e/.auth/session.json',  // reutiliza sessão salva
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command:              'npm run dev',
    url:                  'http://localhost:5173',
    reuseExistingServer:  true,  // não sobe novo server se já estiver rodando
    timeout:              30_000,
  },
})
