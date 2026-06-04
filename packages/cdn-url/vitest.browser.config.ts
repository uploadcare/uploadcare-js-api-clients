import { defineConfig } from 'vite'

/**
 * Runs the same unit test suite in real Chromium — proves the library is
 * browser-safe (no Node builtins, URL/replaceAll available, etc).
 */
export default defineConfig({
  define: {
    __DEV__: 'true'
  },
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
