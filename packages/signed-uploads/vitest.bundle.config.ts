import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'bundle',
    environment: 'node',
    // Needs `dist`, so this is run from `postbuild` rather than `npm test`.
    include: ['tests/bundle/**/*.test.ts']
  }
})
