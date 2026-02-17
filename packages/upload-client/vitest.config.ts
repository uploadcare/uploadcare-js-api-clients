/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 15000,
    environmentMatchGlobs: [
      ['test/browser/**', 'jsdom'],
      ['test/tools/getBlobFromReactNativeAsset.test.ts', 'jsdom'],
      ['test/tools/getContentType.test.ts', 'jsdom'],
      ['test/tools/getFileName.test.ts', 'jsdom'],
      ['test/tools/getFileSize.test.ts', 'jsdom'],
      ['test/tools/isFileData.test.ts', 'jsdom']
    ]
  }
})
