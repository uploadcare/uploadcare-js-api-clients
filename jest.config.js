export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 15000,
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  setupFiles: ['../../env.js'],
  reporters: ['default', 'github-actions']
}
