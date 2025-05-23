import path from 'node:path'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [dts({ insertTypesEntry: true })],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      name: 'index',
      fileName: 'index'
    },
    rollupOptions: {
      treeshake: 'smallest'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve('src')
    }
  }
})
