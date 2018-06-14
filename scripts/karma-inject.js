const path = require('path')

const resolveBundle = (packageName, bundlePath) =>
  path.resolve(path.dirname(require.resolve(packageName)), bundlePath)

const createPattern = path => ({
  pattern: path,
  included: true,
  served: true,
  watched: false,
})

const packages = {
  'jest-matchers': 'bundle.js',
  'jest-mock': 'bundle.js',
  '@babel/polyfill': '../dist/polyfill.js',
}

const initCustom = files => {
  for (const pkg of Object.keys(packages)) {
    const bundlePath = packages[pkg]

    files.unshift(createPattern(resolveBundle(pkg, bundlePath)))
  }
}

initCustom.$inject = ['config.files']

module.exports = {'framework:inject': ['factory', initCustom]}
