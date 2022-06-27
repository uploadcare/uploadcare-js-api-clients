import { config } from 'dotenv'
import chalk from 'chalk'
import * as url from 'url'
import path from 'path'

const VARS = [
  'UPLOAD_CLIENT_DEFAULT_PUBLIC_KEY',
  'REST_CLIENT_DEFAULT_PUBLIC_KEY',
  'REST_CLIENT_DEFAULT_SECRET_KEY'
]

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
