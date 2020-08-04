import alias from '@rollup/plugin-alias'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-typescript2'

const config = ({ format, browser }) => ({
  input: 'src/index.ts',
  output: {
    dir: `dist`,
    format,
    entryFileNames: [
      '[name]',
      browser && 'browser',
      format === 'esm' ? 'js' : 'cjs'
    ]
      .filter(Boolean)
      .join('.')
  },
  plugins: [
    nodeResolve({ browser }),

    browser &&
      alias({
        entries: [
          {
            find: '../request/request.node',
            replacement: '../request/request.browser'
          },
          {
            find: '../tools/sockets.node',
            replacement: '../tools/sockets.browser'
          },
          {
            find: './getFormData.node',
            replacement: './getFormData.browser'
          }
        ]
      }),

    typescript({
      tsconfig: 'tsconfig.build.json',
      tsconfigOverride: {
        compilerOptions: {
          target: format === 'esm' ? 'es6' : 'es5'
        }
      }
    })
  ],
  external: browser ? [] : ['https', 'http', 'stream', 'url']
})

export default [
  config({ format: 'cjs', browser: true }),
  config({ format: 'cjs', browser: false }),
  config({ format: 'esm', browser: true }),
  config({ format: 'esm', browser: false })
]
