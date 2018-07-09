import license from 'rollup-plugin-license'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'
import {terser} from 'rollup-plugin-terser'
import {sizeSnapshot} from 'rollup-plugin-size-snapshot'

const getPlugins = ({iife} = {}) =>
  [
    replace({'process.env.NODE_ENV': process.env.NODE_ENV}),
    resolve({browser: iife}),
    iife &&
      commonjs({
        include: 'node_modules/**',
        sourceMap: false,
      }),
    babel(),
    iife && terser(),
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
    input: 'src/upload/index.js',
    plugins: getPlugins({iife: false}),
    external: ['axios', 'query-string', 'form-data'],
    output: [
      {
        file: 'dist/upload.esm.js',
        format: 'esm',
        interop: false,
      },
    ],
  },
  {
    input: 'src/index.js',
    plugins: getPlugins({iife: false}),
    external: ['axios', 'query-string', 'form-data'],
    output: [
      {
        file: 'dist/uploadcare.cjs.js',
        format: 'cjs',
        interop: false,
      },
    ],
  },
  {
    input: 'src/index.js',
    plugins: getPlugins({iife: true}),
    output: [
      {
        file: 'dist/uploadcare.iife.js',
        format: 'iife',
        name: 'uploadcareAPI',
        interop: false,
      },
    ],
  },
]
