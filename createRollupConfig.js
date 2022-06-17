import alias from '@rollup/plugin-alias'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import nodeExtenals from 'rollup-plugin-node-externals'
import path from 'path'
import fs from 'fs'

import * as url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'package.json'))
)

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
    targetEnv === RollupTargetEnv.NODE && nodeExtenals(),
    nodeResolve({
      customResolveOptions: {
        moduleDirectory: packageJson.workspaces
      }
    }),
    typescript({
      tsconfig: path.join(cwd, 'tsconfig.build.json')
    })
  ]
})
