import {
  createRollupConfig,
  RollupTargetEnv
} from '../../createRollupConfig.js'
import * as url from 'url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const config = ({ targetEnv }) =>
  createRollupConfig({ targetEnv, cwd: __dirname })

export default [
  ...config({ targetEnv: RollupTargetEnv.NODE }),
  ...config({ targetEnv: RollupTargetEnv.BROWSER }),
  ...config({ targetEnv: RollupTargetEnv.REACT_NATIVE })
]
