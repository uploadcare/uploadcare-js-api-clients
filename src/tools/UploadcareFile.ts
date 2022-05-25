import camelizeKeys from './camelizeKeys'

/* Types */
import {
  FileInfo,
  Uuid,
  ImageInfo,
  VideoInfo,
  Metadata,
  ContentInfo
} from '../api/types'

export class UploadcareFile {
  readonly uuid: Uuid
  readonly name: null | string = null
  readonly size: null | number = null
  readonly isStored: null | boolean = null
  readonly isImage: null | boolean = null
  readonly mimeType: null | string = null
  readonly cdnUrl: null | string = null
  readonly originalFilename: null | string = null
  readonly imageInfo: null | ImageInfo = null
  readonly videoInfo: null | VideoInfo = null
  readonly contentInfo: null | ContentInfo = null
  readonly metadata: null | Metadata = null
  readonly s3Bucket: null | string = null

  constructor(
    fileInfo: FileInfo,
    {
      baseCDN,
      fileName
    }: {
      baseCDN?: string
      fileName?: string
    }
  ) {
    const cdnUrl = `${baseCDN}/${fileInfo.uuid}/`

    this.uuid = fileInfo.uuid
    this.name = fileName || fileInfo.filename
    this.size = fileInfo.size
    this.isStored = fileInfo.isStored
    this.isImage = fileInfo.isImage
    this.mimeType = fileInfo.mimeType
    this.cdnUrl = cdnUrl
    this.originalFilename = fileInfo.originalFilename
    this.imageInfo = camelizeKeys(fileInfo.imageInfo)
    this.videoInfo = camelizeKeys(fileInfo.videoInfo)
    this.contentInfo = camelizeKeys(fileInfo.contentInfo)
    this.metadata = fileInfo.metadata || null
    this.s3Bucket = fileInfo.s3Bucket || null
  }
}
