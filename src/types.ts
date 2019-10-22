import {FileInfoInterface, GeoLocationInterface, GroupId, Uuid} from './api/types'
import {Url} from './api/fromUrl'
import {UploadInterface} from './lifecycle/types'

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
  retryUnknownFromUrlStatusMaxTimes?: number;
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
  retryUnknownFromUrlStatusMaxTimes: number;
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

interface AudioInterface {
  bitrate: number | null;
  codec: string | null;
  sampleRate: number | null;
  channels: string | null;
}

interface VideoInterface {
  height: number;
  width: number;
  frameRate: number;
  bitrate: number;
  codec: string;
}

export interface OriginalVideoInfoInterface {
  duration: number;
  format: string;
  bitrate: number;
  audio: AudioInterface | null;
  video: VideoInterface;
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
  readonly originalVideoInfo: null | OriginalVideoInfoInterface;
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
  Cancelled = 'cancelled',
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

export interface UploadClientInterface {
  updateSettings(newSettings: SettingsInterface): void;

  getSettings(): SettingsInterface;

  fileFrom(data: FileData | Url | Uuid, settings?: SettingsInterface): UploadInterface<UploadcareFileInterface>;

  groupFrom(data: FileData[] | Url[] | Uuid[], settings?: SettingsInterface): UploadInterface<UploadcareGroupInterface>;
}
