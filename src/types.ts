import {FileInfoInterface, GeoLocationInterface, GroupId} from './api/types'

export interface SettingsInterface {
  baseCDN?: string;
  baseURL?: string;
  publicKey?: string | null;
  fileName?: string;
  doNotStore?: boolean;
  secureSignature?: string;
  secureExpire?: string;
  integration?: string;
  checkForUrlDuplicates?: boolean;
  saveUrlForRecurrentUploads?: boolean;
  source?: string;
  jsonpCallback?: string;
  pollingTimeoutMilliseconds?: number;
  maxContentLength?: number;
  retryThrottledRequestMaxTimes?: number;
  multipartChunkSize?: number;
  multipartMinFileSize?: number;
  multipartMinLastPartSize?: number;
  maxConcurrentRequests?: number;
}

export interface DefaultSettingsInterface extends SettingsInterface {
  baseCDN: string;
  baseURL: string;
  fileName: string;
  maxContentLength: number;
  retryThrottledRequestMaxTimes: number;
  multipartMinFileSize: number;
  multipartChunkSize: number;
  multipartMinLastPartSize: number;
  maxConcurrentRequests: number;
  pollingTimeoutMilliseconds: number;
}

export type FileData = Blob | File | Buffer

export interface OriginalImageInfoInterface {
  width: number;
  height: number;
  format: string;
  datetimeOriginal: null | string;
  geoLocation: null | GeoLocationInterface;
  orientation: null | number;
  dpi: null | number[];
  colorMode: string;
  sequence?: boolean;
}

/* TODO Add sourceInfo */
export interface UploadcareFileInterface {
  readonly uuid: string;
  readonly name: null | string;
  readonly size: null | number;
  readonly isStored: null | boolean;
  readonly isImage: null | boolean;
  readonly cdnUrl: null | string;
  readonly cdnUrlModifiers: null | string;
  readonly originalUrl: null | string;
  readonly originalFilename: null | string;
  readonly originalImageInfo: null | OriginalImageInfoInterface;
}

export interface UploadcareGroupInterface {
  readonly uuid: GroupId;
  readonly filesCount: string;
  readonly totalSize: number;
  readonly isStored: boolean;
  readonly isImage: boolean;
  readonly cdnUrl: string;
  readonly files: FileInfoInterface[];
  readonly createdAt: string;
  readonly storedAt: string | null;
}

export enum ProgressStateEnum {
  Pending = 'pending',
  Uploading = 'uploading',
  Uploaded = 'uploaded',
  Ready = 'ready',
  Canceled = 'canceled',
  Error = 'error',
}

export interface ProgressParamsInterface {
  total: number;
  loaded: number;
}

export type UploadingProgress = {
  state: ProgressStateEnum;
  uploaded: null | ProgressParamsInterface;
  value: number;
}
