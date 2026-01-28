import { UploadcareFile } from '../../src/tools/UploadcareFile'
import { FileInfo, GroupFileInfo } from '../../src/api/types'

const createFileInfo = (overrides: Partial<FileInfo> = {}): FileInfo => ({
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
  s3Bucket: 'my-bucket',
  metadata: undefined,
  ...overrides
})

describe('UploadcareFile', () => {
  it('builds cdn and s3 URLs with custom base and keeps overrides', () => {
    const fileInfo = createFileInfo()

    const file = new UploadcareFile(fileInfo, {
      baseCDN: 'https://1s4oyld5dc.ucarecd.net',
      fileName: 'custom-name.jpg'
    })

    expect(file.cdnUrl).toBe(
      'https://1s4oyld5dc.ucarecd.net/12345678-aaaa-bbbb-cccc-000000000001/'
    )
    expect(file.s3Url).toBe(
      'https://my-bucket.s3.amazonaws.com/12345678-aaaa-bbbb-cccc-000000000001/photo.jpg'
    )
    expect(file.name).toBe('custom-name.jpg')
    expect(file.metadata).toBeNull()
  })

  it('sets defaultEffects when provided by group file info', () => {
    const groupFileInfo: GroupFileInfo = {
      ...createFileInfo({ uuid: '12345678-aaaa-bbbb-cccc-000000000002' }),
      defaultEffects: '-/resize/640x/'
    }

    const file = new UploadcareFile(groupFileInfo)

    expect(file.defaultEffects).toBe('-/resize/640x/')
    expect(file.cdnUrl).toBe(
      'https://ucarecdn.com/12345678-aaaa-bbbb-cccc-000000000002/'
    )
  })

  it('keeps defaultEffects null for regular file info', () => {
    const fileInfo = createFileInfo({ isImage: false, s3Bucket: undefined })

    const file = new UploadcareFile(fileInfo)

    expect(file.defaultEffects).toBeNull()
    expect(file.s3Url).toBeNull()
    expect(file.isImage).toBe(false)
  })
})
