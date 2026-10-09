import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import { playwright } from '@vitest/browser-playwright'
import { msw } from 'msw/vite'
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
        listen: resolve(__dirname, 'src/listen.ts'),
        browser: resolve(__dirname, 'src/browser.ts'),
        node: resolve(__dirname, 'src/node.ts'),
        msw: resolve(__dirname, 'src/msw.ts')
      },
      formats: ['es'],
      fileName: '[name]'
    },
    rollupOptions: {
      // Keep these runtime imports rather than trying to bundle them; only
      // `listen.js` and `node.js` ever pull them in, which is what keeps the
      // "." entry browser-safe.
      external: [
        'node:http',
        'node:https',
        // Optional peers of `./browser` and `./msw` (and, for the
        // interceptors, `./node`),
        // resolved from the consumer's own install: bundling them would ship a
        // second MSW next to theirs.
        /^msw(?:\/|$)/,
        /^@mswjs\/interceptors(?:\/|$)/
      ]
    }
  },
  test: {
    // Puts back every `vi.spyOn` (console included) before each test, so a
    // failed assertion can't leave a spy silencing the rest of the file.
    restoreMocks: true,
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
        // Serves `/mockServiceWorker.js` from the installed msw, as an app
        // would, instead of leaning on @vitest/browser's own mapping (which
        // resolves msw from its own install, not this package's).
        plugins: [msw({ mode: 'worker-only' })],
        // Discovered late otherwise, which reloads the page mid-run.
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
  }
})
