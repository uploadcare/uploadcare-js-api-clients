import license from 'rollup-plugin-license'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'
import {terser} from 'rollup-plugin-terser'
import {sizeSnapshot} from 'rollup-plugin-size-snapshot'

const getPlugins = (format, minify = false) =>
  [
    replace({'process.env.NODE_ENV': process.env.NODE_ENV}),
    resolve({browser: format === 'iife'}),
    (format === 'iife') &&
      commonjs({
        include: 'node_modules/**',
        sourceMap: false,
      }),
    babel(),
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

export default [
  {
    input: 'src/index.js',
    plugins: getPlugins('esm'),
    external: ['axios', 'form-data'],
    output: [
      {
        file: 'dist/uploadcare-upload-api.esm.js',
        format: 'esm',
        interop: false,
      },
    ],
  },
  {
    input: 'src/index.js',
    plugins: getPlugins('cjs'),
    external: ['axios', 'form-data'],
    output: [
      {
        file: 'dist/uploadcare-upload-api.cjs.js',
        format: 'cjs',
        interop: false,
      },
    ],
  },
  {
    input: 'src/index.js',
    plugins: getPlugins('iife'),
    output: [
      {
        file: 'dist/uploadcare-upload-api.js',
        format: 'iife',
        name: 'uploadcareAPI',
        interop: false,
      },
    ],
  },
  {
    input: 'src/index.js',
    plugins: getPlugins('iife', true),
    output: [
      {
        file: 'dist/uploadcare-upload-api.min.js',
        format: 'iife',
        name: 'uploadcareAPI',
        interop: false,
      },
    ],
  },
]
