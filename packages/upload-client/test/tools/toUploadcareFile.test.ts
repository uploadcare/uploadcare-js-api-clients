// eslint-disable-next-line import/no-unresolved -- subpath export, resolved by bundler/TS
import { getPrefixedCdnBaseSync } from '@uploadcare/cname-prefix/sync'
import { expect } from '@jest/globals'
import { toUploadcareFile } from '../../src/tools/toUploadcareFile'
import { defaultSettings } from '../../src/defaultSettings'
import { FileInfo } from '../../src/api/types'

const publicKey = 'demopublickey'
const uuid = '12345678-aaaa-bbbb-cccc-000000000001'

const fileInfo = {
  size: 100,
  done: 100,
  total: 100,
  uuid,
  fileId: uuid,
  originalFilename: 'photo.jpg',
  filename: 'photo.jpg',
  mimeType: 'image/jpeg',
  isImage: true,
  isStored: true,
  isReady: true,
  imageInfo: null,
  videoInfo: null,
  contentInfo: null,
  s3Bucket: undefined,
  metadata: undefined
} as FileInfo

describe('toUploadcareFile', () => {
  it('builds cdnUrl on the prefixed base by default', async () => {
    const file = await toUploadcareFile(fileInfo, { publicKey })
    const expectedBase = getPrefixedCdnBaseSync(
      publicKey,
      defaultSettings.prefixedBaseCDN
    )

    expect(file.cdnUrl).toBe(`${expectedBase}/${uuid}/`)
  })

  it('keeps a custom baseCDN untouched', async () => {
    const file = await toUploadcareFile(fileInfo, {
      publicKey,
      baseCDN: 'https://cdn.example.com'
    })

    expect(file.cdnUrl).toBe(`https://cdn.example.com/${uuid}/`)
  })
})
