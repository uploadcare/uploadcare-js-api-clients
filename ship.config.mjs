import { writeFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export default {
  monorepo: {
    mainVersionFile: 'package.json',
    packagesToBump: ['packages/*'],
    packagesToPublish: ['packages/upload-client']
  },
  publishCommand: ({ defaultCommand }) => `${defaultCommand} --access public`,
  versionUpdated: ({ version, dir }) => {
    const versionPath = resolve(dir, 'src/version.ts')
    if(existsSync(versionPath)) {
      writeFileSync(versionPath, `export default '${version}'\n`)
    }
  },
  pullRequestReviewers: ['nd0ut']
}
