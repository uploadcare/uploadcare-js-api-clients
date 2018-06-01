/* eslint-disable no-console */

const path = require('path')
const fs = require('fs')
const rollup = require('rollup')

const jestMatchersDir = path.dirname(
  path.resolve(require.resolve('jest-mock')),
)

const build = async(input, output) => {
  const bundle = await rollup.rollup({
    input: input,
    plugins: [
      require('rollup-plugin-node-resolve-magic')({
        basedir: jestMatchersDir,
        browser: true,
        main: false,
      }),
      require('rollup-plugin-babel')(),
      require('rollup-plugin-commonjs')(),
      require('rollup-plugin-node-builtins')(),
      require('rollup-plugin-node-globals')(),
    ],
  })

  return await bundle.write({
    file: output,
    format: 'umd',
    name: 'jest',
  })
}

;(async() => {
  const input = path.resolve(jestMatchersDir, 'index.js')
  const output = path.resolve(jestMatchersDir, 'bundle.js')

  if (fs.existsSync(output)) {
    console.log('jest-matches build exist, skip')

    return
  }

  try {
    await build(input, output)
    console.log('jest-matches built successfully')
  }
  catch (exception) {
    console.err(exception)
  }
})()
