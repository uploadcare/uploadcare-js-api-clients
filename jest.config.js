import path from 'path'
import url from 'url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export default {
  testEnvironment: 'node',
  testTimeout: 15000,
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: path.resolve(__dirname, './tsconfig.test.json')
      }
    ]
  },
  reporters: ['default', 'github-actions'],
  setupFilesAfterEnv: ['jest-extended/all']
}
