import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 15000,
    setupFiles: ['../../env.js']
  }
})
