export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 15000,
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
      isolatedModules: true
    }
  },
  setupFiles: ['../../env.js'],
  reporters: ['default', 'github-actions'],
  setupFilesAfterEnv: ['jest-extended/all']
}
