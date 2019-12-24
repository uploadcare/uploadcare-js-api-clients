const fs = require('fs');
const path = require('path');

module.exports = {
  publishCommand: ({ defaultCommand }) => `${defaultCommand} --access public`,
  mergeStrategy: { toSameBranch: ['master'] },
  versionUpdated: ({ version, dir }) => {
    const versionPath = path.resolve(dir, 'src/version.ts');
    fs.writeFileSync(versionPath, `export default '${version}'\n`);
  }
}
