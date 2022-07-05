import { getUserAgent } from '../../src/tools/getUserAgent'
import version from '../../src/version'

describe('getUserAgent', () => {
  it('should work', () => {
    expect(getUserAgent({ publicKey: 'demopublickey' })).toEqual(
      `UploadcareUploadClient/${version}/demopublickey (JavaScript)`
    )
  })
})
