import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // `client` is browser code, but it only uses `atob`, `TextDecoder` and
    // `Date`, all of which Node provides — so one environment covers both
    // entries and no browser runner is needed.
    environment: 'node',
    // The bundle tests import the built package, so they mean nothing until
    // there is one. `vitest.bundle.config.ts` runs them after the build.
    exclude: [...configDefaults.exclude, 'tests/bundle/**']
  }
})
