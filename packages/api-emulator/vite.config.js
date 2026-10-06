import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { playwright } from '@vitest/browser-playwright'
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
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: ['test/**/*.test.ts'],
          exclude: ['test/browser/**']
        }
      },
      {
        // `./browser` is tested where it runs: a Service Worker and real
        // `xhr.upload` events don't exist in Node.
        extends: true,
        // Discovered late otherwise, which reloads the page mid-run. (msw
        // itself is left to @vitest/browser, which handles it on its own.)
        optimizeDeps: { include: ['@mswjs/interceptors/XMLHttpRequest'] },
        test: {
          name: 'browser',
          include: ['test/browser/**/*.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            screenshotFailures: false,
            // The page is served from 127.0.0.1, so `localhost` on the same
            // port is a real, reachable foreign origin for the `unhandled`
            // policy tests.
            api: { host: '127.0.0.1' }
          }
        }
      }
    ]
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
