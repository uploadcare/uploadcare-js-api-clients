import {FileInfo, GroupId} from './api/types'

export interface Settings {
  baseCDN?: string,
  baseURL?: string,
  publicKey?: string | null,
  fileName?: string,
  doNotStore?: boolean,
  secureSignature?: string,
  secureExpire?: string,
  integration?: string,
  checkForUrlDuplicates?: boolean,
  saveUrlForRecurrentUploads?: boolean,
  source?: string,
  jsonpCallback?: string,
  maxContentLength?: number,
  retryThrottledRequestMaxTimes?: number,
  multipartChunkSize?: number,
  multipartMinFileSize?: number,
  multipartMinLastPartSize?: number,
}

export interface DefaultSettings extends Settings {
  baseCDN: string,
  baseURL: string,
  fileName: string,
  maxContentLength: number,
  retryThrottledRequestMaxTimes: number,
  multipartMinFileSize: number,
  multipartChunkSize: number,
  multipartMinLastPartSize: number,
}

export type FileData = Blob | File | Buffer

export type OriginalImageInfo = {
  width: number,
  height: number,
  format: string,
  datetimeOriginal: null | string,
  geoLocation: null | {
    latitude: number,
    longitude: number,
  },
  orientation: null | number,
  dpi: null | Array<number>,
  colorMode: string,
  sequence?: boolean,
}

/* TODO Add sourceInfo */
export interface UploadcareFileInterface {
  readonly uuid: string,
  readonly name: null | string,
  readonly size: null | number,
  readonly isStored: null | boolean,
  readonly isImage: null | boolean,
  readonly cdnUrl: null | string,
  readonly cdnUrlModifiers: null | string,
  readonly originalUrl: null | string,
  readonly originalFilename: null | string,
  readonly originalImageInfo: null | OriginalImageInfo,
}

export interface UploadcareGroupInterface {
  readonly uuid: GroupId,
  readonly filesCount: string,
  readonly totalSize: number,
  readonly isStored: boolean,
  readonly isImage: boolean,
  readonly cdnUrl: string,
  readonly files: FileInfo[],
  readonly createdAt: string,
  readonly storedAt: string | null,
}

export enum ProgressState {
  Pending = 'pending',
  Uploading = 'uploading',
  Uploaded = 'uploaded',
  Ready = 'ready',
  Canceled = 'canceled',
  Error = 'error',
}

export type ProgressParams = {
  total: number,
  loaded: number,
}

export type UploadingProgress = {
  state: ProgressState,
  uploaded: null | ProgressParams,
  value: number,
}
