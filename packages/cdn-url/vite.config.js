import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

const __dirname = dirname(fileURLToPath(import.meta.url))

const entries = {
  index: resolve(__dirname, 'src/index.ts'),
  ops: resolve(__dirname, 'src/ops/index.ts'),
  video: resolve(__dirname, 'src/video/index.ts'),
  document: resolve(__dirname, 'src/document/index.ts'),
  gif2video: resolve(__dirname, 'src/gif2video/index.ts'),
  group: resolve(__dirname, 'src/group/index.ts'),
  proxy: resolve(__dirname, 'src/proxy/index.ts'),
  builder: resolve(__dirname, 'src/builder/index.ts'),
  fluent: resolve(__dirname, 'src/fluent/index.ts'),
  validate: resolve(__dirname, 'src/validate/index.ts')
}

/**
 * Two bundle flavors from one source:
 * - `vite build --mode development` → dist/dev: readable, eager validation,
 *   runtime checks and descriptive errors (`__DEV__` = true)
 * - `vite build` (production) → dist/prod: minified, checks stripped by DCE
 *   (`__DEV__` = false)
 *
 * Types are emitted once (production pass) into dist/types.
 */
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'

  // Third flavor: a single-file IIFE global for <script>-tag usage.
  if (mode === 'iife') {
    return {
      define: { __DEV__: 'false' },
      build: {
        outDir: 'dist',
        emptyOutDir: false,
        minify: 'esbuild',
        lib: {
          entry: resolve(__dirname, 'src/iife.ts'),
          name: 'UCCdnUrl',
          formats: ['iife'],
          fileName: () => 'cdn-url.global.js'
        }
      }
    }
  }

  return {
    define: {
      __DEV__: JSON.stringify(isDev)
    },
    plugins: isDev
      ? []
      : [
          dts({
            outDir: resolve(__dirname, 'dist/types'),
            insertTypesEntry: true,
            exclude: ['vitest.config.ts', '**/*.test.ts']
          })
        ],
    build: {
      outDir: isDev ? 'dist/dev' : 'dist/prod',
      emptyOutDir: true,
      minify: isDev ? false : 'esbuild',
      lib: {
        entry: entries,
        fileName: '[name]'
      },
      rollupOptions: {
        treeshake: 'smallest'
      }
    }
  }
})
