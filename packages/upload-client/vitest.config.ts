import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 15000,
    restoreMocks: true,
    // Reported, never enforced: a map of the error branches no test reaches
    // (`npm run test:coverage`, then coverage/index.html).
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      reporter: ['text-summary', 'html']
    },
    setupFiles: ['../../env.js', './test/_emulator.ts']
  }
})
