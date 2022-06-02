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
    env === 'browser' || env === 'react-native'
      ? []
      : ['https', 'http', 'stream', 'url', 'form-data', 'ws']
})

export default [
  config({ env: 'node' }),
  config({ env: 'browser' }),
  config({ env: 'react-native' }),
]
