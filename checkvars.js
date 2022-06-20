import { config } from 'dotenv'
import chalk from 'chalk'
import * as url from 'url'
import path from 'path'

const VARS = ['UC_KEY_FOR_INTEGRATION_TESTS']

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const check = () => {
  config({ path: path.join(__dirname, '.env') })

  const undefinedVars = VARS.filter((variable) => process.env[variable] == null)
  if (undefinedVars.length !== 0) {
    console.log(
      chalk.red(
        `Please add ${chalk.bold(undefinedVars.join(', '))} to .env config`
      )
    )
    process.exit(1)
  }
}

check()
