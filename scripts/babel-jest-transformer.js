const babelJest = require('babel-jest')

const plugins = ['@babel/plugin-transform-modules-commonjs']
const transformer = babelJest.createTransformer({plugins})

transformer.createTransformer = () => babelJest.createTransformer({plugins})

module.exports = transformer
