import { FileInfo, Uuid } from '../api/types'
import {
  ContentInfo,
  ImageInfo,
  VideoInfo,
  Metadata
} from '@uploadcare/api-client-utils'

export class UploadcareFile {
  readonly uuid: Uuid
  readonly name: null | string = null
  readonly size: null | number = null
  readonly isStored: null | boolean = null
  readonly isImage: null | boolean = null
  readonly mimeType: null | string = null
  readonly cdnUrl: null | string = null
  readonly s3Url: null | string = null
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
    const { uuid, s3Bucket } = fileInfo
    const cdnUrl = `${baseCDN}/${uuid}/`
    const s3Url = s3Bucket
      ? `https://${s3Bucket}.s3.amazonaws.com/${uuid}/${fileInfo.filename}`
      : null

    this.uuid = uuid
    this.name = fileName || fileInfo.filename
    this.size = fileInfo.size
    this.isStored = fileInfo.isStored
    this.isImage = fileInfo.isImage
    this.mimeType = fileInfo.mimeType
    this.cdnUrl = cdnUrl
    this.originalFilename = fileInfo.originalFilename
    this.imageInfo = fileInfo.imageInfo
    this.videoInfo = fileInfo.videoInfo
    this.contentInfo = fileInfo.contentInfo
    this.metadata = fileInfo.metadata || null
    this.s3Bucket = s3Bucket || null
    this.s3Url = s3Url
  }
}
