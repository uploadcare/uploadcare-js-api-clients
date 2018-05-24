import license from 'rollup-plugin-license'
import babel from 'rollup-plugin-babel'

export default {
  input: 'src/uploadcareAPI.js',
  plugins: [
    license({
      banner: `
        <%= pkg.name %> <%= pkg.version %>
        <%= pkg.description %>
        <%= pkg.homepage %>
        Date: <%= moment().format('YYYY-MM-DD') %>
      `,
    }),
    babel(),
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
