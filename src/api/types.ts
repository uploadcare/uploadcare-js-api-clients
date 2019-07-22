import {HandleProgressFunction, RequestOptions, RequestResponse} from './request/types'
import {FileData, Settings} from '../types'
import {InfoResponse} from './info'
import {FromUrlResponse, Url} from './fromUrl'
import {FromUrlStatusResponse} from './fromUrlStatus'
import {GroupInfoResponse} from './group'
import {
  MultipartCompleteResponse,
  MultipartPart,
  MultipartStartResponse,
  MultipartUploadInterface
} from './multipart/types'

interface StatusInterface {
  status: string,
}

interface ProgressInterface {
  size: number,
  done: number,
  total: number,
}

interface ProgressStatusInterface extends StatusInterface, ProgressInterface {}

export type ProgressStatus = ProgressStatusInterface

interface GeoLocationInterface {
  latitude: number,
  longitude: number,
}

interface ImageInfoInterface {
  height: number,
  width: number,
  geo_location: null | GeoLocationInterface,
  datetime_original: string,
  format: string,
  color_mode: string,
  dpi: null | Array<number>,
  orientation: null | number,
  sequence?: boolean,
}

type Audio = {
  bitrate: number | null,
  codec: string | null,
  sample_rate: number | null,
  channels: string | null,
}

type Video = {
  height: number,
  width: number,
  frame_rate: number,
  bitrate: number,
  codec: string,
}

interface VideoInfoInterface {
  duration: number,
  format: string,
  bitrate: number,
  audio: Audio | null,
  video: Video
}

export interface FileInfoInterface extends ProgressInterface, ImageInfoInterface, VideoInfoInterface {
  uuid: Uuid,
  file_id: Uuid,
  original_filename: string,
  filename: string,
  mime_type: string,
  is_image: string,
  is_store: string,
  is_ready: string,
}

export type FileInfo = FileInfoInterface

export type GroupInfo = {
  datetime_created: string,
  datetime_stored: string | null,
  files_count: string,
  cdn_url: string,
  files: FileInfo[],
  url: string,
  id: GroupId,
}

/* Base */
export type BaseProgress = ProgressEvent

export type BaseResponse = {
  file: Uuid
}

export interface DirectUploadInterface extends Promise<BaseResponse>, CancelableInterface {
  onProgress: HandleProgressFunction | null
  onCancel: VoidFunction | null
}

export interface CancelableInterface {
  cancel(): void
}

export type Token = string

export type Uuid = string

export type GroupId = string

export interface UploadAPIInterface {
  request(options: RequestOptions): Promise<RequestResponse>

  base(data: FileData, settings?: Settings): DirectUploadInterface

  info(uuid: Uuid, settings?: Settings): Promise<InfoResponse>

  fromUrl(sourceUrl: Url, settings?: Settings): Promise<FromUrlResponse>

  fromUrlStatus(token: Token, settings?: Settings): Promise<FromUrlStatusResponse>

  group(files: Uuid[], settings: Settings): Promise<GroupInfoResponse>

  groupInfo(id: GroupId, settings: Settings): Promise<GroupInfoResponse>

  multipartStart(file: FileData, settings: Settings): Promise<MultipartStartResponse>

  multipartUpload(file: FileData, parts: MultipartPart[], settings: Settings): MultipartUploadInterface

  multipartComplete(uuid: Uuid, settings: Settings): Promise<MultipartCompleteResponse>
}
