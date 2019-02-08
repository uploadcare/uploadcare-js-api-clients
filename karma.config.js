// const babel = require('rollup-plugin-babel')
const typescript = require('rollup-plugin-typescript2')
// const browserStackConf = require('./browserstack.json')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const replace = require('rollup-plugin-replace')
const json = require('rollup-plugin-json')

process.env.CHROME_BIN = require('puppeteer').executablePath()

module.exports = function(config) {
  config.set({
    browserNoActivityTimeout: 60000,
    browsers: ['ChromeHeadless'],
    frameworks: ['jasmine'],

    files: [
      {
        pattern: 'test/**/*.spec.js',
        watched: false,
      },
    ],

    plugins: [
      'karma-rollup-preprocessor',
      'karma-chrome-launcher',
      'karma-jasmine',
    ],

    preprocessors: {'test/**/*.spec.js': ['rollup']},
    rollupPreprocessor: {
      plugins: [
        replace({'process.env.NODE_ENV': process.env.NODE_ENV}),
        json(),
        resolve({browser: true}),
        commonjs({include: 'node_modules/**'}),
        typescript(),
      ],
      output: {
        format: 'iife',
        name: 'uploadcare',
        sourcemap: false,
      },
    },
  })
}
