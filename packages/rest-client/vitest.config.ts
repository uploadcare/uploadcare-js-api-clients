import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // These hit the real REST API with the keys from `.env`, so they are slow.
    testTimeout: 15000,
    setupFiles: ['../../env.js'],
    // Resets the test project's groups, metadata and webhooks once per run.
    globalSetup: './test/globalSetup.ts'
  }
})
