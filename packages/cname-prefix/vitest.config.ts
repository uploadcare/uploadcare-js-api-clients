import { defineConfig } from 'vite'

/**
 * Two projects, because the package ships two implementations of the same API.
 * Everything under `src/node/` is the `node` export condition's build and uses
 * `node:crypto`, so it cannot run in a browser; everything else is the browser
 * build and is tested where it actually runs.
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'browser',
          include: ['src/**/*.test.ts'],
          exclude: ['src/node/**'],
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
      },
      {
        test: {
          name: 'node',
          include: ['src/node/**/*.test.ts'],
          environment: 'node'
        }
      }
    ]
  }
})
