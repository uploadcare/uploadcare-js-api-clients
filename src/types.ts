import {FileInfoInterface, GeoLocationInterface, GroupId, Uuid} from './api/types'
import {FileFromEnum} from './fileFrom/types'
import {Url} from './api/fromUrl'
import {UploadInterface} from './lifecycle/types'
import {GroupFromEnum} from './groupFrom/types'

export interface UploadClientInterface {
  /**
   * Update settings with a new ones.
   *
   * @param {SettingsInterface} newSettings - New client settings.
   * @return {void}
   */
  updateSettings(newSettings: SettingsInterface): void;

  /**
   * Get current client settings.
   *
   * @return {SettingsInterface}
   */
  getSettings(): SettingsInterface;

  /**
   * Add callable listener for updated settings.
   * It will be called when the settings change.
   *
   * @param {Function} listener
   * @return {void}
   */
  addUpdateSettingsListener(listener: Function): void;

  /**
   * Remove callable listener for updated settings.
   *
   * @param {Function} listener
   * @return {void}
   */
  removeUpdateSettingsListener(listener: Function): void;

  /**
   * Upload file.
   *
   * @param {FileFromEnum} from - Method of uploading.
   * @param {FileData | Url | Uuid} data - Data to upload.
   * @param {SettingsInterface} settings - Client settings.
   * @return {UploadInterface<UploadcareFileInterface>}
   */
  fileFrom(from: FileFromEnum, data: FileData | Url | Uuid, settings?: SettingsInterface): UploadInterface<UploadcareFileInterface>;

  /**
   * Upload group of files.
   *
   * @param {GroupFromEnum} from - Method of uploading.
   * @param {FileData[] | Url[] | Uuid[]} data - Data to upload.
   * @param {SettingsInterface} settings - Client settings.
   * @return {UploadInterface<UploadcareGroupInterface>}
   */
  groupFrom(from: GroupFromEnum, data: FileData[] | Url[] | Uuid[], settings?: SettingsInterface): UploadInterface<UploadcareGroupInterface>;
}

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
