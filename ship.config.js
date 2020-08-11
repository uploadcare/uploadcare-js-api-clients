const fs = require('fs');
const path = require('path');

module.exports = {
  publishCommand: ({ defaultCommand }) => `${defaultCommand} --access public`,
  mergeStrategy: { toSameBranch: ['master', 'alpha'] },
  versionUpdated: ({ version, dir }) => {
    const versionPath = path.resolve(dir, 'src/version.ts');
    fs.writeFileSync(versionPath, `export default '${version}'\n`);
  },
  pullRequestReviewers: ['jeetiss'],
  slack: {
    // disable slack notification for `prepared` lifecycle.
    // Ship.js will send slack message only for `releaseSuccess`.
    prepared: null,
  },
  // skip preparation if master contain only `chore` commits
  shouldPrepare: ({ releaseType, commitNumbersPerType }) => {
    const { fix = 0 } = commitNumbersPerType;
    if (releaseType === "patch" && fix === 0) {
      return false;
    }
    return true;
  }
}
