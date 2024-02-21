/// <reference types="vitest" />
import { defineConfig, type PluginOption } from 'vite'
import url from 'url'
import path from 'path'
import getRawBody from 'raw-body'
import { writeFile, mkdir, access } from 'fs/promises'

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
        try {
          await access(snapshotsFolder)
        } catch (err) {
          await mkdir(snapshotsFolder)
        }
        await writeFile(path.resolve(snapshotsFolder, filename), body)
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
    coverage: {
      provider: 'istanbul'
    },
    browser: {
      enabled: true,
      name: 'chromium',
      provider: 'playwright',
      headless: true
    }
  }
})
