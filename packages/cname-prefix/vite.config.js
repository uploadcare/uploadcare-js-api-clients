import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        async: resolve(__dirname, 'src/async/index.ts'),
        sync: resolve(__dirname, 'src/sync/index.ts'),
        // The `node` export condition resolves to these: same API, Node's
        // native SHA-256, so the portable implementation never reaches a server
        // bundle.
        'node/index': resolve(__dirname, 'src/node/index.ts'),
        'node/async': resolve(__dirname, 'src/node/async.ts'),
        'node/sync': resolve(__dirname, 'src/node/sync.ts')
      },
      fileName: '[name]'
    },
    rollupOptions: {
      treeshake: 'smallest',
      // Keep `node:crypto` a runtime import rather than trying to bundle it.
      external: ['node:crypto']
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
