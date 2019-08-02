import UploadClient from '../UploadClient'
import {FileFromEnum} from '../fileFrom/types'
import * as fs from 'fs'

export const cli = async() => {
  const argv = require('yargs').argv
  const ora = require('ora')
  const prettyjson = require('prettyjson')

  const client = new UploadClient({publicKey: argv.publicKey})

  const spinner = ora.default('Loading... 0%').start()

  try {
    const fileUpload = client.fileFrom(argv.from, fs.readFileSync(argv._[0]))

    fileUpload.onProgress = ({state, uploaded, value}) => {
      spinner.text = `Loading... ${value}%`
    }

    const result = await fileUpload

    spinner.succeed('Success!')

    console.log(prettyjson.render(result, {}))
  }
  catch (error) {
    console.error(error)
    spinner.fail('Failed :(')
  }
}
