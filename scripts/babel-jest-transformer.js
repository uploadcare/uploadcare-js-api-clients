const babelJest = require('babel-jest')

const plugins = ['@babel/plugin-transform-modules-commonjs']
const presets = [
  [
    '@babel/preset-env',
    {
      modules: false,
      useBuiltIns: 'usage',
      targets: {
        browsers: ['> 0.5%', 'last 2 versions', 'Firefox ESR', 'not dead'],
        node: '8.0.0',
      },
    },
  ],
  '@babel/preset-flow',
]
const transformer = babelJest.createTransformer({
  plugins,
  presets,
})

transformer.createTransformer = () =>
  babelJest.createTransformer({
    presets,
    plugins,
  })

module.exports = transformer
