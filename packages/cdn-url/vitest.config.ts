import { defineConfig } from 'vite'

export default defineConfig({
  // Tests exercise the development semantics: eager validation throws.
  // Bundle-flavor differences are covered by scripts/verify-bundles.mjs.
  define: {
    __DEV__: 'true'
  },
  test: {
    environment: 'node'
  }
})
