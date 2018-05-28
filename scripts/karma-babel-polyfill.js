const path = require('path')

const babelPolyfillDir = path.dirname(
  path.resolve(require.resolve('@babel/polyfill')),
)

const bablePolyfillBundle = path.resolve(babelPolyfillDir, '../dist/polyfill.js')

const createPattern = path => ({
  pattern: path,
  included: true,
  served: true,
  watched: false,
})

const initCustom = files => {
  files.unshift(createPattern(bablePolyfillBundle))
}

initCustom.$inject = ['config.files']

module.exports = {'framework:@babel/polyfill': ['factory', initCustom]}
