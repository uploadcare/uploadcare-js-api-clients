const configStandard = require('prettier-config-standard')

module.exports = {
  ...configStandard,
  overrides: [
    {
      files: ['**/*.ts'],
      options: {
        plugins: ['prettier-plugin-jsdoc']
      }
    }
  ]
}
