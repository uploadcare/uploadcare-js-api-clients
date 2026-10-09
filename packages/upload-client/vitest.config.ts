import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 15000,
    restoreMocks: true,
    setupFiles: ['../../env.js', './test/_emulator.ts']
  }
})
