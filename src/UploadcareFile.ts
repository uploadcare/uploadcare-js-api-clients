import {OriginalImageInfoInterface, SettingsInterface, UploadcareFileInterface} from './types'
import prettyFileInfo from './prettyFileInfo'
import {FileInfoInterface, Uuid} from './api/types'

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
  }

  static fromFileInfo(fileInfo: FileInfoInterface, settings: SettingsInterface): UploadcareFileInterface {
    const pretty = prettyFileInfo(fileInfo, settings)

    return new UploadcareFile({
      uuid: pretty.uuid,
      name: pretty.name,
      size: pretty.size,
      isStored: pretty.isStored,
      isImage: pretty.isImage,
      cdnUrl: pretty.cdnUrl,
      cdnUrlModifiers: pretty.cdnUrlModifiers,
      originalUrl: pretty.originalUrl,
      originalFilename: pretty.originalFilename,
      originalImageInfo: pretty.originalImageInfo,
    })
  }
}
