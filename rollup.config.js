import license from 'rollup-plugin-license'
import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import replace from 'rollup-plugin-replace'

export default {
  input: 'src/index.js',
  plugins: [
    replace({'process.env.NODE_ENV': process.env.NODE_ENV}),
    resolve({browser: true}),
    commonjs({include: 'node_modules/**'}),
    babel(),
    license({
      banner: `
        <%= pkg.name %> <%= pkg.version %>
        <%= pkg.description %>
        <%= pkg.homepage %>
        Date: <%= moment().format('YYYY-MM-DD') %>
      `,
    }),
  ],
  output: [
    {
      file: 'dist/uploadcare.umd.js',
      name: 'uploadcareAPI',
      format: 'umd',
    },
    {
      file: 'dist/uploadcare.esm.js',
      name: 'uploadcareAPI',
      format: 'esm',
    },
  ],
}
