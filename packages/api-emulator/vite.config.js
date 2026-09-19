import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      exclude: ['**/*.test.ts', 'test/**', 'scripts/**']
    })
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        listen: resolve(__dirname, 'src/listen.ts')
      },
      formats: ['es'],
      fileName: '[name]'
    },
    rollupOptions: {
      // Same as the 'smallest' preset, except `moduleSideEffects`: 'smallest'
      // sets that to `false`, which drops the side-effect-only imports in
      // `index.ts` that register every route — the built bundle answered zero
      // requests. 'no-external' keeps side effects for our own modules while
      // still treeshaking dependencies as aggressively as before.
      treeshake: {
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false
      },
      // Keep these runtime imports rather than trying to bundle them; only
      // `listen.js` ever pulls them in, which is what keeps the "." entry
      // browser-safe.
      external: ['node:http', 'node:https']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
