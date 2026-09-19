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
      treeshake: 'smallest',
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
