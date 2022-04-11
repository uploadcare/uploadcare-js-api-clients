import { writeFileSync } from 'fs';
import { resolve } from 'path';

export default {
  publishCommand: ({ defaultCommand }) => `${defaultCommand} --access public`,
  versionUpdated: ({ version, dir }) => {
    const versionPath = resolve(dir, 'src/version.ts');
    writeFileSync(versionPath, `export default '${version}'\n`);
  },
  pullRequestReviewers: ['nd0ut'],
  slack: {
    // disable slack notification for `prepared` lifecycle.
    // Ship.js will send slack message only for `releaseSuccess`.
    prepared: null,
  }
}
