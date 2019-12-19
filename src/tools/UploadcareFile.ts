import camelizeKeys from './camelizeKeys'

/* Types */
import {
  OriginalImageInfoInterface,
  OriginalVideoInfoInterface,
  UploadcareFileInterface
} from '../types'
import { FileInfo, Uuid } from '../api/types'

export class UploadcareFile implements UploadcareFileInterface {
  readonly uuid: Uuid
  readonly name: null | string = null
  readonly size: null | number = null
  readonly isStored: null | boolean = null
  readonly isImage: null | boolean = null
  readonly cdnUrl: null | string = null
  readonly cdnUrlModifiers: null | string = null
  readonly originalUrl: null | string = null
  readonly originalFilename: null | string = null
  readonly originalImageInfo: null | OriginalImageInfoInterface = null
  readonly originalVideoInfo: null | OriginalVideoInfoInterface = null

  constructor(
    fileInfo: FileInfo,
    {
      baseCDN,
      defaultEffects,
      fileName
    }: {
      baseCDN?: string
      defaultEffects?: string
      fileName?: string
    }
  ) {
    const { uuid, s3Bucket } = fileInfo

    const urlBase = s3Bucket
      ? `https://${s3Bucket}.s3.amazonaws.com/${uuid}/${fileInfo.filename}`
      : `${baseCDN}/${uuid}/`
    const cdnUrlModifiers = defaultEffects ? `-/${defaultEffects}` : null
    const cdnUrl = `${urlBase}${cdnUrlModifiers || ''}`
    const originalUrl = uuid ? urlBase : null

    this.uuid = uuid
    this.name = fileName || fileInfo.filename
    this.size = fileInfo.size
    this.isStored = fileInfo.isStored
    this.isImage = fileInfo.isImage
    this.cdnUrl = cdnUrl
    this.cdnUrlModifiers = cdnUrlModifiers
    this.originalUrl = originalUrl
    this.originalFilename = fileInfo.originalFilename
    this.originalImageInfo = camelizeKeys(fileInfo.imageInfo)
    this.originalVideoInfo = camelizeKeys(fileInfo.videoInfo)
  }
}
