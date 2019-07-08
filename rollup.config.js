import license from 'rollup-plugin-license'
import typescript from 'rollup-plugin-typescript2'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'
import {terser} from 'rollup-plugin-terser'
import {sizeSnapshot} from 'rollup-plugin-size-snapshot'
import json from 'rollup-plugin-json'

const getPlugins = (format, env, minify = false) =>
  [
    replace({
      'process.env.NODE_ENV': process.env.NODE_ENV,
      'process.env.BUNDLE_ENV': env,
    }),
    json(),
    resolve({browser: format === 'umd'}),
    format === 'umd' &&
      commonjs({
        include: 'node_modules/**',
        sourceMap: false,
      }),
    typescript(),
    minify && terser({sourcemap: false}),
    license({
      banner: `
          <%= pkg.name %> <%= pkg.version %>
          <%= pkg.description %>
          <%= pkg.homepage %>
          Date: <%= moment().format('YYYY-MM-DD') %>
        `,
    }),
    sizeSnapshot(),
  ].filter(plugin => !!plugin)

const chosePostfix = (format, env, minify = false) => {
  if (minify) return '.min'
  if (format === 'umd') return ''
  else return `.${env}.${format}`
}

const getConfig = (format, env, minify = false) => ({
  input: 'src/index.ts',
  plugins: getPlugins(format, env, minify),
  external: format === 'umd' ? [] : ['axios', 'form-data'],
  output: [
    {
      file: `dist/uploadcare-upload-client${chosePostfix(format, env, minify)}.js`,
      format,
      name: 'uploadcareAPI',
      interop: false,
    },
  ],
})

export default [
  getConfig('esm', 'browser'),
  getConfig('cjs', 'browser'),
  getConfig('umd', 'browser'),
  getConfig('umd', 'browser', true),

  getConfig('esm', 'node'),
  getConfig('cjs', 'node'),
]
