import license from 'rollup-plugin-license'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'
import {terser} from 'rollup-plugin-terser'
import {sizeSnapshot} from 'rollup-plugin-size-snapshot'

const getPlugins = ({forBrowser, uglify, banner} = {}) =>
  [
    replace({'process.env.NODE_ENV': process.env.NODE_ENV}),
    forBrowser && resolve({browser: true}),
    commonjs({
      include: 'node_modules/**',
      sourceMap: false,
    }),
    babel(),
    uglify && terser(),
    banner &&
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

export default [
  {
    input: 'src/index.js',
    plugins: getPlugins({forBrowser: false}),
    external: ['axios', 'query-string', 'form-data'],
    output: [
      {
        file: 'dist/uploadcare.cjs.js',
        format: 'cjs',
        interop: false,
      },
      {
        file: 'dist/uploadcare.esm.js',
        format: 'esm',
        interop: false,
      },
    ],
  },
  {
    input: 'src/index.js',
    plugins: getPlugins({forBrowser: true}),
    external: ['axios', 'query-string', 'form-data'],
    output: [
      {
        file: 'dist/uploadcare.browser.cjs.js',
        format: 'cjs',
        interop: false,
      },
      {
        file: 'dist/uploadcare.browser.esm.js',
        format: 'esm',
        interop: false,
      },
    ],
  },
  {
    input: 'src/index.js',
    plugins: getPlugins({
      forBrowser: true,
      uglify: true,
      banner: true,
    }),
    output: [
      {
        file: 'dist/uploadcare.browser.iife.js',
        format: 'iife',
        name: 'uploadcareAPI',
        interop: false,
      },
    ],
  },
]
