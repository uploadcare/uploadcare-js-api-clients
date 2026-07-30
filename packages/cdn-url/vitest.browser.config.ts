import { configDefaults } from 'vitest/config'
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
    // `*.node.test.ts` exercises Node builtins (server-side signing), which have
    // no place in a browser bundle and cannot resolve here. Extend the defaults
    // rather than replacing them, or `dist` and the caches come back into scope.
    exclude: [...configDefaults.exclude, '**/*.node.test.ts'],
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
