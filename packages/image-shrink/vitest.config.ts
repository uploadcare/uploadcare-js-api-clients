import type { PluginOption } from 'vite'
import { defineConfig } from 'vitest/config'
import url from 'url'
import path from 'path'
import getRawBody from 'raw-body'
import { writeFile, mkdir } from 'fs/promises'
import { playwright } from '@vitest/browser-playwright'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const uploadPlugin = (): PluginOption => ({
  name: 'upload-server',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.method === 'POST' && req.url?.startsWith('/upload-image')) {
        const { filename } = url.parse(req.url, true).query as {
          filename: string
        }
        const body = await getRawBody(req)
        const snapshotsFolder = path.join(__dirname, './src/test/snapshots/')
        // Uploads arrive in parallel; `recursive` makes a concurrent mkdir a no-op.
        await mkdir(snapshotsFolder, { recursive: true })
        await writeFile(
          path.resolve(snapshotsFolder, filename),
          new Uint8Array(body)
        )
        res.statusCode = 200
        res.end('ok')
        return
      }
      next()
    })
  }
})

export default defineConfig({
  plugins: [uploadPlugin()],
  test: {
    testTimeout: 100000,
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        {
          browser: 'chromium',
          headless: true
        }
      ]
    }
  }
})
