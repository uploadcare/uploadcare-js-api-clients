/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [
        {
          browser: 'chromium',
          headless: true
        }
      ]
    }
  }
})
