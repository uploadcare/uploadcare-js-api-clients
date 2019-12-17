import {
  OriginalImageInfoInterface,
  OriginalVideoInfoInterface,
  SettingsInterface,
  UploadcareFileInterface
} from './types'
import prettyFileInfo from './prettyFileInfo'
import { FileInfo, Uuid } from './api/types'
import camelizeKeys from './tools/camelizeKeys'

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

  constructor(file: UploadcareFileInterface) {
    this.uuid = file.uuid
    this.name = file.name
    this.size = file.size
    this.isStored = file.isStored
    this.isImage = file.isImage
    this.cdnUrl = file.cdnUrl
    this.cdnUrlModifiers = file.cdnUrlModifiers
    this.originalUrl = file.originalUrl
    this.originalFilename = file.originalFilename
    this.originalImageInfo = file.originalImageInfo
    this.originalVideoInfo = file.originalVideoInfo
  }

  static fromFileInfo(
    fileInfo: FileInfo,
    { baseCDN, defaultEffects }: { baseCDN?: string; defaultEffects?: string }
  ): UploadcareFileInterface {
    const { uuid, s3Bucket } = fileInfo

    const urlBase = s3Bucket
      ? `https://${s3Bucket}.s3.amazonaws.com/${uuid}/${fileInfo.filename}`
      : `${baseCDN}/${uuid}/`
    const cdnUrlModifiers = defaultEffects ? `-/${defaultEffects}` : null
    const cdnUrl = uuid ? `${urlBase}${cdnUrlModifiers || ''}` : null
    const originalUrl = uuid ? urlBase : null

    return new UploadcareFile({
      uuid,
      name: fileInfo.filename,
      size: fileInfo.size,
      isStored: fileInfo.isStored,
      isImage: fileInfo.isImage,
      cdnUrl: cdnUrl,
      cdnUrlModifiers,
      originalUrl,
      originalFilename: fileInfo.originalFilename,
      originalImageInfo: camelizeKeys(fileInfo.imageInfo),
      originalVideoInfo: camelizeKeys(fileInfo.videoInfo)
    })
  }

  static fromUuid(uuid: Uuid): UploadcareFileInterface {
    return new UploadcareFile({
      uuid,
      name: null,
      size: null,
      isStored: null,
      isImage: null,
      cdnUrl: null,
      cdnUrlModifiers: null,
      originalUrl: null,
      originalFilename: null,
      originalImageInfo: null,
      originalVideoInfo: null
    })
  }
}
