process.env.CHROME_BIN = require('puppeteer').executablePath()

const files = [
  '../src/request/**.ts',
  '../src/tools/CancelController.ts',
  '../src/tools/errors.ts',
  '../src/tools/getUrl.ts',
  './**/*.test.ts',
]

module.exports = function(config) {
  config.set({
    browserNoActivityTimeout: 60000,
    browsers: ['ChromeHeadless'],
    reporters: ['progress', 'karma-typescript'],
    frameworks: ['jasmine', 'karma-typescript'],
    captureConsole: true,

    files,

    plugins: ['karma-typescript', 'karma-chrome-launcher', 'karma-jasmine'],

    preprocessors: files.reduce((conf, next) => {
      conf[next] = ['karma-typescript']

      return conf
    }, {}),

    karmaTypescriptConfig: {
      bundlerOptions: {
        addNodeGlobals: true,
        constants: { 'process.env': { NODE_ENV: process.env.NODE_ENV } }
      },
      compilerOptions: {
        target: 'es5',
        lib: ['es2015', 'dom'],
        strict: true,
        resolveJsonModule: true,
        noImplicitAny: false,
        strictNullChecks: true
      },
      include: files,
      exclude: ['../node_modules', '../test']
    }
  })
}
