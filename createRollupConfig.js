import alias from '@rollup/plugin-alias'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import typescript from '@rollup/plugin-typescript'
import nodeExternals from 'rollup-plugin-node-externals'
import path from 'path'
import copy from 'rollup-plugin-copy'

export const RollupTargetEnv = Object.freeze({
  BROWSER: 'browser',
  NODE: 'node',
  REACT_NATIVE: 'react-native'
})

const RollbarFormat = Object.freeze({
  CJS: 'cjs',
  ESM: 'esm'
})

export const createRollupConfig = ({ targetEnv, cwd }) =>
  [RollbarFormat.CJS, RollbarFormat.ESM].map((format) => {
    const extension = format === 'esm' ? 'mjs' : 'cjs'
    return {
      input: 'src/index.ts',
      output: {
        dir: path.join(cwd, 'dist', format),
        format: format,
        entryFileNames: ['[name]', targetEnv, extension]
          .filter(Boolean)
          .join('.'),
        chunkFileNames: () => `[name].[hash].${extension}`
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
        }),
        // @see https://github.com/arethetypeswrong/arethetypeswrong.github.io
        copy({
          targets: [
            {
              src: path.join(cwd, 'dist', 'index.d.ts'),
              dest: path.join(cwd, 'dist', format),
              rename: `index.${targetEnv}.d.${format === 'esm' ? 'mts' : 'cts'}`
            }
          ]
        })
      ]
    }
  })
