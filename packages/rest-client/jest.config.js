import baseConfig from '../../jest.config.js'

export default {
  ...baseConfig,
  globalSetup: './test/globalSetup.js',
  setupFilesAfterEnv: ['jest-extended/all']
}
