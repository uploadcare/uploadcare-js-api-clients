const babel = require('rollup-plugin-babel')
const browserStackConf = require('./browserstack.json')

process.env.CHROME_BIN = require('puppeteer').executablePath()

module.exports = function(config) {
  config.set({
    browserStack: {
      username: browserStackConf.username,
      accessKey: browserStackConf.accessKey,
    },
    browsers: ['ChromeHeadless'],
    frameworks: ['jest-matchers', 'jasmine'],

    files: [
      {
        pattern: 'src/**/*.spec.js',
        watched: false,
      },
    ],

    plugins: [
      'karma-browserstack-launcher',
      'karma-chrome-launcher',
      'karma-jasmine',
      'karma-rollup-preprocessor',
      require('./scripts/karma-jest-matchers'),
    ],

    preprocessors: {'src/**/*.spec.js': ['rollup']},
    rollupPreprocessor: {
      plugins: [babel()],
      output: {
        format: 'iife',
        name: 'uploadcare',
        sourcemap: 'inline',
      },
    },

    customLaunchers: {
      bs_firefox59_win10: {
        base: 'BrowserStack',
        browser: 'Firefox',
        browser_version: '59.0',
        os: 'Windows',
        os_version: '10',
      },
    },

    client: {jasmine: {}},
  })
}
