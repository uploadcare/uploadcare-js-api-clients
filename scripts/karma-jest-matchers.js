const path = require('path')

const jestMatchersDir = path.dirname(
  path.resolve(require.resolve('jest-matchers')),
)

const jestMatchersBundle = path.resolve(jestMatchersDir, 'bundle.js')

const createPattern = path => ({
  pattern: path,
  included: true,
  served: true,
  watched: false,
})

const initCustom = files => {
  files.unshift(createPattern(jestMatchersBundle))
}

initCustom.$inject = ['config.files']

module.exports = {'framework:jest-matchers': ['factory', initCustom]}
