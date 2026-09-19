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

export const createRollupConfig = ({ targetEnv, cwd, exclude }) =>
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
        /**
         * `@uploadcare/api-client-utils` is inlined because it is not
         * published: a consumer could not install it, so it has to travel
         * inside whatever depends on it.
         *
         * Every other `@uploadcare/*` package is published, so it stays an
         * import. They ship node and browser builds behind export conditions,
         * and inlining one here would freeze whichever variant this build
         * machine happened to resolve into the published output, for every
         * consumer. Left external, the consumer's bundler or runtime picks,
         * and an app using two of our packages ships one copy rather than two.
         *
         * A package externalised this way has to be a real `dependency`, not a
         * devDependency, or consumers get an unresolved import.
         */
        nodeExternals({ exclude: /@uploadcare\/api-client-utils/ }),
        nodeResolve(),
        typescript({
          tsconfig: path.join(cwd, 'tsconfig.build.json'),
          exclude
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
