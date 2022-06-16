import { writeFileSync } from 'fs'
import { resolve } from 'path'

export default {
  monorepo: {
    mainVersionFile: 'package.json',
    packagesToBump: ['packages/*'],
    packagesToPublish: ['packages/*']
  },
  publishCommand: ({ defaultCommand }) => `${defaultCommand} --access public`,
  versionUpdated: ({ version, dir }) => {
    const versionPath = resolve(dir, 'src/version.ts')
    writeFileSync(versionPath, `export default '${version}'\n`)
  },
  pullRequestReviewers: ['nd0ut']
}
