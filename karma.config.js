const babel = require('rollup-plugin-babel')
// const browserStackConf = require('./browserstack.json')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const replace = require('rollup-plugin-replace')

process.env.CHROME_BIN = require('puppeteer').executablePath()

module.exports = function(config) {
  config.set({
    // browserStack: {
    //   username: browserStackConf.username,
    //   accessKey: browserStackConf.accessKey,
    // },
    browserNoActivityTimeout: 50000,
    browsers: ['ChromeHeadless'],
    frameworks: ['inject', 'jasmine'],

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
      require('./scripts/karma-inject'),
    ],

    preprocessors: {'src/**/*.spec.js': ['rollup']},
    rollupPreprocessor: {
      plugins: [
        replace({'process.env.NODE_ENV': process.env.NODE_ENV}),
        resolve({browser: true}),
        commonjs({include: 'node_modules/**'}),
        babel(),
      ],
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
