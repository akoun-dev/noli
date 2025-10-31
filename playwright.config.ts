import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration des tests E2E pour Noli Assurance
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Dossier des tests E2E
  testDir: './tests/e2e',

  // Exécuter les tests en parallèle
  fullyParallel: true,

  // Ne pas échouer sur les erreurs non traitées
  forbidOnly: !!process.env.CI,

  // Réessayer en CI en cas d'échec
  retries: process.env.CI ? 2 : 0,

  // Limiter le nombre de workers en CI pour éviter la surcharge
  workers: process.env.CI ? 1 : undefined,

  // Rapporteur de tests
  reporter: process.env.CI ? 'github' : 'html',

  // Variables globales pour les tests
  use: {
    // URL de base de l'application
    baseURL: process.env.BASE_URL || 'http://localhost:8080',

    // Capturer les traces en cas d'échec
    trace: 'on-first-retry',

    // Capturer les screenshots en cas d'échec
    screenshot: 'only-on-failure',

    // Timeout pour les actions
    actionTimeout: 10 * 1000,

    // Timeout pour la navigation
    navigationTimeout: 30 * 1000,
  },

  // Configuration des projets pour différents navigateurs
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Tests mobiles
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tests tablettes
    {
      name: 'iPad',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // Serveur de développement
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Dossier pour les artefacts de test
  outputDir: 'test-results/',

  // Timeout global pour les tests
  timeout: 60 * 1000,

  // Timeout d'attente pour les éléments
  expect: {
    timeout: 10 * 1000,
  },
});