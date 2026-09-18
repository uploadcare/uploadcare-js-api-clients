import { copyFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

const ENTRY_NAMES = ['index', 'server', 'client']

export default defineConfig({
  plugins: [
    dts({
      // Flatten each entry's types into one file. Unbundled declarations
      // import each other without a file extension, which Node's ESM
      // resolution rejects — `attw` reports it as an internal resolution
      // error.
      rollupTypes: true,
      exclude: ['**/*.test.ts', 'vite.config.ts', 'vitest.config.ts'],
      afterBuild: () => {
        // The `require` conditions need `.d.cts`, or TypeScript reads the
        // ESM-flavored `.d.ts` for a CommonJS file and every consumer on
        // `moduleResolution: node16` sees the package as ESM-only.
        for (const name of ENTRY_NAMES) {
          copyFileSync(
            resolve(__dirname, `dist/${name}.d.ts`),
            resolve(__dirname, `dist/${name}.d.cts`)
          )
        }
      }
    })
  ],
  build: {
    lib: {
      // `index` re-exports `server`, so the root stays the Node API it has
      // always been; `client` is the only entry a browser bundle pulls in.
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        server: resolve(__dirname, 'src/server.ts'),
        client: resolve(__dirname, 'src/client.ts')
      },
      fileName: '[name]'
    },
    rollupOptions: {
      treeshake: 'smallest',
      // Keep `node:crypto` a runtime import rather than trying to bundle it.
      external: ['node:crypto']
    }
  }
})
