import alias from '@rollup/plugin-alias'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import nodeExternals from 'rollup-plugin-node-externals'
import path from 'path'

export const RollupTargetEnv = {
  BROWSER: 'browser',
  NODE: 'node',
  REACT_NATIVE: 'react-native'
}

export const createRollupConfig = ({ targetEnv, cwd }) => ({
  input: 'src/index.ts',
  output: {
    dir: path.join(cwd, 'dist'),
    format: 'esm',
    entryFileNames: ['[name]', targetEnv, 'js'].filter(Boolean).join('.')
  },
  plugins: [
    alias({
      // replace `*.node.ts` imports with `*.{{env}}.ts` to create separate bundles for each environment
      entries: [
        {
          find: /(\.)(node)/,
          replacement: `$1${targetEnv}`
        }
      ]
    }),
    // Uncomment when we will ready to use @uploadcare/api-client-utils as external dependency
    // for browsers.
    // nodeExternals({ include: /@uploadcare/ }),
    nodeExternals({ exclude: /@uploadcare/ }),
    nodeResolve(),
    typescript({
      tsconfig: path.join(cwd, 'tsconfig.build.json')
    })
  ]
})
