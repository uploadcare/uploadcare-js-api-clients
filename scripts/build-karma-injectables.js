/* eslint-disable no-console */

const path = require('path')
const fs = require('fs')
const rollup = require('rollup')

const build = async({name, base, input, output}) => {
  const bundle = await rollup.rollup({
    input: input,
    plugins: [
      require('rollup-plugin-node-resolve-magic')({
        basedir: base,
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
    name: name,
  })
}

const tryBuild = async({exportName, packageName, inputPath, outputPath}) => {
  const packageDir = path.dirname(path.resolve(require.resolve(packageName)))
  const input = path.resolve(packageDir, inputPath)
  const output = path.resolve(packageDir, outputPath)

  if (fs.existsSync(output)) {
    console.log(`${packageName} build exist, skip`)

    return
  }

  try {
    await build({
      name: exportName,
      base: packageDir,
      input,
      output,
    })
    console.log(`${packageName} built successfully`)
  }
  catch (exception) {
    console.error(exception)
  }
}

const packages = {
  'jest-matchers': {
    name: 'expect',
    input: 'index.js',
    output: 'bundle.js',
  },
  'jest-mock': {
    name: 'jest',
    input: 'index.js',
    output: 'bundle.js',
  },
}

for (const pkg of Object.keys(packages)) {
  const {name, input, output} = packages[pkg]

  tryBuild({
    exportName: name,
    packageName: pkg,
    inputPath: input,
    outputPath: output,
  })
}
