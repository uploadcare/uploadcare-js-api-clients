import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    // `client` is browser code, but it only uses `atob`, `TextDecoder` and
    // `Date`, all of which Node provides — so one environment covers both
    // entries and no browser runner is needed.
    environment: 'node'
  }
})
