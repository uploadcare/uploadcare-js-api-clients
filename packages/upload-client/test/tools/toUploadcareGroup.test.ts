// eslint-disable-next-line import/no-unresolved -- subpath export, resolved by bundler/TS
import { getPrefixedCdnBaseSync } from '@uploadcare/cname-prefix/sync'
import { expect } from '@jest/globals'
import { toUploadcareGroup } from '../../src/tools/toUploadcareGroup'
import { defaultSettings } from '../../src/defaultSettings'
import { GroupFileInfo, GroupInfo } from '../../src/api/types'

const publicKey = 'demopublickey'
const groupId = '12345678-aaaa-bbbb-cccc-000000000000~2'
const fileUuid = '12345678-aaaa-bbbb-cccc-000000000001'

const createFile = (overrides: Partial<GroupFileInfo> = {}): GroupFileInfo => ({
  size: 100,
  done: 100,
  total: 100,
  uuid: fileUuid,
  fileId: fileUuid,
  originalFilename: 'photo.jpg',
  filename: 'photo.jpg',
  mimeType: 'image/jpeg',
  isImage: true,
  isStored: true,
  isReady: true,
  imageInfo: null,
  videoInfo: null,
  contentInfo: null,
  metadata: undefined,
  defaultEffects: '-/resize/640x/',
  ...overrides
})

const groupInfo: GroupInfo = {
  datetimeCreated: '2024-01-01T00:00:00Z',
  datetimeStored: '2024-01-02T00:00:00Z',
  filesCount: '1',
  cdnUrl: `https://ucarecdn.com/${groupId}/`,
  files: [createFile()],
  url: 'https://uploadcare.com/groups/12345678-aaaa-bbbb-cccc-000000000000/',
  id: groupId
}

describe('toUploadcareGroup', () => {
  it('builds group and member cdnUrls on the prefixed base by default', async () => {
    const group = await toUploadcareGroup(groupInfo, { publicKey })
    const expectedBase = getPrefixedCdnBaseSync(
      publicKey,
      defaultSettings.prefixedBaseCDN
    )

    expect(group.cdnUrl).toBe(`${expectedBase}/${groupId}/`)
    expect(group.files[0].cdnUrl).toBe(`${expectedBase}/${fileUuid}/`)
  })

  it('keeps a custom baseCDN untouched', async () => {
    const group = await toUploadcareGroup(groupInfo, {
      publicKey,
      baseCDN: 'https://cdn.example.com'
    })

    expect(group.cdnUrl).toBe(`https://cdn.example.com/${groupId}/`)
    expect(group.files[0].cdnUrl).toBe(`https://cdn.example.com/${fileUuid}/`)
  })
})
