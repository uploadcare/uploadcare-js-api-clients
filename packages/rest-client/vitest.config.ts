/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 15000,
    globalSetup: './test/globalSetup.ts'
  }
})
