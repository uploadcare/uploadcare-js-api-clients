import {OriginalImageInfo, Settings, UploadcareFileInterface} from './types'
import {FileInfo} from './api/types'
import prettyFileInfo from './prettyFileInfo'

export class UploadcareFile implements UploadcareFileInterface {
  private readonly fileInfo: FileInfo

  readonly uuid: string
  readonly name: null | string = null
  readonly size: null | number = null
  readonly isStored: null | boolean = null
  readonly isImage: null | boolean = null
  readonly cdnUrl: null | string = null
  readonly cdnUrlModifiers: null | string = null
  readonly originalUrl: null | string = null
  readonly originalFilename: null | string = null
  readonly originalImageInfo: null | OriginalImageInfo = null

  constructor(fileInfo: FileInfo, settings: Settings) {
    this.fileInfo = fileInfo
    const pretty = prettyFileInfo(fileInfo, settings)

    this.uuid = pretty.uuid
    this.name = pretty.name
    this.size = pretty.size
    this.isStored = pretty.isStored
    this.isImage = pretty.isImage
    this.cdnUrl = pretty.cdnUrl
    this.cdnUrlModifiers = pretty.cdnUrlModifiers
    this.originalUrl = pretty.originalUrl
    this.originalFilename = pretty.originalFilename
    this.originalImageInfo = pretty.originalImageInfo
  }
}
