import license from 'rollup-plugin-license'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'

const getPlugins = ({forBrowser} = {}) =>
  [
    replace({'process.env.NODE_ENV': process.env.NODE_ENV}),
    forBrowser && resolve({browser: true}),
    commonjs({
      include: 'node_modules/**',
      sourceMap: false,
    }),
    babel(),
    license({
      banner: `
      <%= pkg.name %> <%= pkg.version %>
      <%= pkg.description %>
      <%= pkg.homepage %>
      Date: <%= moment().format('YYYY-MM-DD') %>
    `,
    }),
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
      },
      {
        file: 'dist/uploadcare.esm.js',
        format: 'esm',
      },
    ],
  },
  {
    input: 'src/index.js',
    plugins: getPlugins({forBrowser: true}),
    output: [
      {
        file: 'dist/uploadcare.browser.umd.js',
        name: 'uploadcareAPI',
        format: 'umd',
      },
      {
        file: 'dist/uploadcare.browser.esm.js',
        format: 'esm',
      },
    ],
  },
]
