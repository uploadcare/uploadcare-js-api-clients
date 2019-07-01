import {FileInfo, GroupId} from './api/types'

export type Settings = {
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
export type UploadcareFile = {
  uuid: string,
  name: null | string,
  size: null | number,
  isStored: null | boolean,
  isImage: null | boolean,
  cdnUrl: null | string,
  cdnUrlModifiers: null | string,
  originalUrl: null | string,
  originalFilename: null | string,
  originalImageInfo: null | OriginalImageInfo,
}

export type UploadcareFiles = Array<UploadcareFile>

export type UploadcareGroup = {
  uuid: GroupId,
  filesCount: string,
  totalSize: number,
  isStored: boolean,
  isImage: boolean,
  cdnUrl: string,
  files: Array<FileInfo>,
  createdAt: string,
  storedAt: string | null,
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
