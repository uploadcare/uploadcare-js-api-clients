import { writeFileSync } from 'fs'
import { resolve } from 'path'

export default {
  monorepo: {
    mainVersionFile: 'package.json',
    packagesToBump: ['packages/*'],
    packagesToPublish: [
      'packages/upload-client',
      'packages/rest-client',
      'packages/signed-uploads',
      'packages/image-shrink'
    ]
  },
  publishCommand: ({ defaultCommand }) => `${defaultCommand} --access public`,
  versionUpdated: ({ version, dir }) => {
    const packages = ['upload-client', 'rest-client', 'api-client-utils']
    const versionPaths = packages.map((p) =>
      resolve(dir, 'packages', p, 'src/version.ts')
    )
    for (const versionPath of versionPaths) {
      writeFileSync(versionPath, `export default '${version}'\n`)
    }
  },
  pullRequestReviewers: ['nd0ut']
}
