import { FileInfo, GroupFileInfo, Uuid } from '../api/types'
import {
  ContentInfo,
  ImageInfo,
  VideoInfo,
  Metadata
} from '@uploadcare/api-client-utils'
import getUrl from './getUrl'
import defaultSettings from '../defaultSettings'

function isGroupFileInfo(
  fileInfo: FileInfo | GroupFileInfo
): fileInfo is GroupFileInfo {
  return 'defaultEffects' in fileInfo
}
export class UploadcareFile {
  readonly uuid: Uuid
  readonly name: string
  readonly size: number
  readonly isStored: boolean
  readonly isImage: boolean
  readonly mimeType: string
  readonly cdnUrl: string
  readonly s3Url: string | null
  readonly originalFilename: string
  readonly imageInfo: ImageInfo | null
  readonly videoInfo: VideoInfo | null
  readonly contentInfo: ContentInfo | null
  readonly metadata: Metadata | null
  readonly s3Bucket: string | null
  readonly defaultEffects: null | string = null

  constructor(
    fileInfo: FileInfo | GroupFileInfo,
    {
      baseCDN = defaultSettings.baseCDN,
      fileName
    }: {
      baseCDN?: string
      fileName?: string
    } = {}
  ) {
    const { uuid, s3Bucket } = fileInfo
    const cdnUrl = getUrl(baseCDN, `${uuid}/`)
    const s3Url = s3Bucket
      ? getUrl(
          `https://${s3Bucket}.s3.amazonaws.com/`,
          `${uuid}/${fileInfo.filename}`
        )
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

    if (isGroupFileInfo(fileInfo)) {
      this.defaultEffects = fileInfo.defaultEffects
    }
  }
}
