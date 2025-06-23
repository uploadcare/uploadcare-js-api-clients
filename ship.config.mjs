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
      'packages/image-shrink',
      'packages/quality-insights',
      'packages/cname-prefix',
    ]
  },
  publishCommand: ({ defaultCommand }) => `${defaultCommand} --access public`,
  versionUpdated: ({ version, dir }) => {
    const packages = [
      'upload-client',
      'rest-client',
      'api-client-utils',
      'quality-insights',
      'cname-prefix'
    ]
    const versionPaths = packages.map((p) =>
      resolve(dir, 'packages', p, 'src/version.ts')
    )
    for (const versionPath of versionPaths) {
      writeFileSync(versionPath, `export default '${version}'\n`)
    }
  },
  pullRequestReviewers: ['nd0ut', 'egordidenko']
}
