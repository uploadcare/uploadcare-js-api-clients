import { UploadcareGroup } from '../../src/tools/UploadcareGroup'
import { GroupFileInfo, GroupInfo } from '../../src/api/types'

const createFile = (overrides: Partial<GroupFileInfo> = {}): GroupFileInfo => ({
  size: 100,
  done: 100,
  total: 100,
  uuid: '12345678-aaaa-bbbb-cccc-000000000001',
  fileId: '12345678-aaaa-bbbb-cccc-000000000001',
  originalFilename: 'photo.jpg',
  filename: 'photo.jpg',
  mimeType: 'image/jpeg',
  isImage: true,
  isStored: true,
  isReady: 'success',
  imageInfo: null,
  videoInfo: null,
  contentInfo: null,
  metadata: undefined,
  defaultEffects: '-/resize/640x/',
  ...overrides
})

const createGroup = (overrides: Partial<GroupInfo> = {}): GroupInfo => ({
  datetimeCreated: '2024-01-01T00:00:00Z',
  datetimeStored: '2024-01-02T00:00:00Z',
  filesCount: '2',
  cdnUrl: 'https://ucarecdn.com/12345678-aaaa-bbbb-cccc-000000000000~2/',
  files: [
    createFile(),
    createFile({ uuid: '12345678-aaaa-bbbb-cccc-000000000002' })
  ],
  url: 'https://uploadcare.com/groups/12345678-aaaa-bbbb-cccc-000000000000/',
  id: '12345678-aaaa-bbbb-cccc-000000000000~2',
  ...overrides
})

describe('UploadcareGroup', () => {
  it('constructs group with custom base CDN and keeps file data', () => {
    const groupInfo = createGroup()

    const group = new UploadcareGroup(groupInfo, {
      baseCDN: 'https://1s4oyld5dc.ucarecd.net'
    })

    expect(group.uuid).toBe(groupInfo.id)
    expect(group.filesCount).toBe('2')
    expect(group.totalSize).toBe(200)
    expect(group.isStored).toBe(true)
    expect(group.isImage).toBe(true)
    expect(group.cdnUrl).toBe(
      'https://1s4oyld5dc.ucarecd.net/12345678-aaaa-bbbb-cccc-000000000000~2/'
    )

    expect(group.files).toHaveLength(2)
    expect(group.files[0].cdnUrl).toBe(
      'https://1s4oyld5dc.ucarecd.net/12345678-aaaa-bbbb-cccc-000000000001/'
    )
    expect(group.files[0].defaultEffects).toBe('-/resize/640x/')
    expect(group.files[1].cdnUrl).toBe(
      'https://1s4oyld5dc.ucarecd.net/12345678-aaaa-bbbb-cccc-000000000002/'
    )

    expect(group.createdAt).toBe('2024-01-01T00:00:00Z')
    expect(group.storedAt).toBe('2024-01-02T00:00:00Z')
  })

  it('ignores null files and keeps aggregates correct', () => {
    const groupInfo = createGroup({
      files: [
        createFile({ size: 50, uuid: '12345678-aaaa-bbbb-cccc-000000000003' }),
        null,
        createFile({
          size: 75,
          uuid: '12345678-aaaa-bbbb-cccc-000000000004',
          isImage: false
        })
      ],
      filesCount: '3'
    })

    const group = new UploadcareGroup(groupInfo)

    expect(group.files).toHaveLength(2)
    expect(group.totalSize).toBe(125)
    expect(group.isImage).toBe(true)
  })
})
