import alias from '@rollup/plugin-alias'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'

const nodeResolver = nodeResolve()

const config = ({ env }) => ({
  input: 'src/index.ts',
  output: {
    dir: `dist`,
    format: 'esm',
    entryFileNames: ['[name]', env, 'js'].filter(Boolean).join('.')
  },
  plugins: [
    alias({
      // replace `*.node.ts` imports with `*.{{env}}.ts` to create separate bundles for each environment
      entries: [
        {
          find: /(\.)(node)/,
          replacement: `$1${env}`,
        }
      ]
    }),
    nodeResolver,
    typescript({
      tsconfig: 'tsconfig.build.json'
    })
  ],
  external:
    env === 'browser'
      ? []
      : ['https', 'http', 'url']
})

export default [
  config({ env: 'node' }),
  config({ env: 'browser' }),
]
