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
        useESM: true
      }
    ]
  },
  reporters: ['default', 'github-actions'],
  setupFilesAfterEnv: ['jest-extended/all']
}
