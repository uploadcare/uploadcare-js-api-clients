import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { msw } from 'msw/vite'

export default defineConfig({
  test: {
    testTimeout: 15000,
    restoreMocks: true,
    // Reported, never enforced: a map of the error branches no test reaches
    // (`npm run test:coverage`, then coverage/index.html).
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      reporter: ['text-summary', 'html']
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          environment: 'node',
          include: ['test/**/*.test.ts'],
          exclude: ['test/chromium/**'],
          setupFiles: ['../../env.js', './test/_emulator.ts']
        }
      },
      {
        // The browser build where it runs: real XHR, real `xhr.upload`
        // progress and a real FormData, against `@uploadcare/api-emulator`'s
        // in-page emulator. jsdom (test/browser) has none of these.
        extends: true,
        // Serves `/mockServiceWorker.js`, which `setupEmulator` registers.
        plugins: [msw({ mode: 'worker-only' })],
        // Discovered late otherwise, which reloads the page mid-run.
        optimizeDeps: { include: ['@mswjs/interceptors/XMLHttpRequest'] },
        resolve: {
          // What the browser bundle does (createRollupConfig.js): every
          // `*.node` import becomes its `*.browser` twin.
          alias: [{ find: /\.node$/, replacement: '.browser' }]
        },
        test: {
          name: 'chromium',
          include: ['test/chromium/**/*.test.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            screenshotFailures: false
          }
        }
      }
    ]
  }
})
