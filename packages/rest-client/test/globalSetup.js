import { exec } from 'child_process'

import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

/**
 * This is hack to run globalSetup.ts
 * because ts-jest isn't able to run globalSetup hook written in typescript
 * with --experimentalSpecifierResolution flag enabled
 */
export default () => {
  const tsxBin = path.join(__dirname, '../../../node_modules/.bin/tsx')
  const cmd = `${tsxBin} ${path.join(__dirname, './globalSetup.ts')}`

  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      stdout && console.log('stdout', stdout)
      stderr && console.log('stderr', stderr)
      if (err) {
        console.error(`Failed to execute "${cmd}"`)
        reject()
        return
      }
      console.log(`Executing of "${cmd}" done.`)
      resolve()
    })
  })
}
