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

const getUndefinedVars = () =>
  VARS.filter((variable) => process.env[variable] == null)

const printVars = (list) => {
  console.log(
    chalk.red(`Please add ${chalk.bold(list.join(', '))} to .env config`)
  )
}

function main() {
  if (getUndefinedVars().length > 0) {
    config({ path: path.join(__dirname, '.env') })
  }

  const undefinedVars = getUndefinedVars()
  if (undefinedVars.length > 0) {
    printVars(undefinedVars)
    process.exit(1)
  }
}

main()
