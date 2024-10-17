/* Low-Level API */
export {
  default as base,
  type BaseOptions,
  type BaseResponse
} from './api/base'
export {
  default as fromUrl,
  type FromUrlOptions,
  type FromUrlResponse,
  type FromUrlSuccessResponse,
  type FileInfoResponse,
  type TokenResponse,
  type TypeEnum
} from './api/fromUrl'
export {
  default as fromUrlStatus,
  type FromUrlStatusOptions,
  type FromUrlStatusResponse,
  type StatusUnknownResponse,
  type StatusWaitingResponse,
  type StatusProgressResponse,
  type StatusErrorResponse,
  type StatusSuccessResponse,
  type Status
} from './api/fromUrlStatus'
export { default as group, type GroupOptions } from './api/group'
export { default as groupInfo, type GroupInfoOptions } from './api/groupInfo'
export { default as info, type InfoOptions } from './api/info'
export {
  default as multipartStart,
  type MultipartStartOptions,
  type MultipartStartResponse,
  type MultipartPart
} from './api/multipartStart'
export {
  default as multipartUpload,
  type MultipartUploadOptions,
  type MultipartUploadResponse
} from './api/multipartUpload'
export {
  default as multipartComplete,
  type MultipartCompleteOptions
} from './api/multipartComplete'

/* High-Level API */
export { uploadFile, type FileFromOptions } from './uploadFile'
export { uploadDirect, type DirectOptions } from './uploadFile/uploadDirect'
export {
  uploadFromUploaded,
  type FromUploadedOptions
} from './uploadFile/uploadFromUploaded'
export {
  uploadFromUrl,
  type UploadFromUrlOptions
} from './uploadFile/uploadFromUrl'
export {
  uploadMultipart,
  type MultipartOptions
} from './uploadFile/uploadMultipart'
export { uploadFileGroup, type GroupFromOptions } from './uploadFileGroup'

/* Helpers */
export { default as UploadClient } from './UploadClient'
export {
  getUserAgent,
  NetworkError,
  Metadata,
  ContentInfo,
  ImageInfo,
  MimeInfo,
  VideoInfo,
  GeoLocation,
  AudioInfo,
  CustomUserAgent,
  CustomUserAgentFn,
  CustomUserAgentOptions,
  GetUserAgentOptions,
  CancelError,
  UploadcareError
} from '@uploadcare/api-client-utils'
export { Queue, Task } from './tools/Queue'

import { NetworkError } from '@uploadcare/api-client-utils'
/** @deprecated Please use NetworkError instead. */
export const UploadcareNetworkError = NetworkError

/* Types */
export { Headers, ErrorRequestInfo } from './request/types'
export { UploadcareFile } from './tools/UploadcareFile'
export { UploadcareGroup } from './tools/UploadcareGroup'
export { UploadError, ErrorResponseInfo } from './tools/UploadError'
export { ServerErrorCode } from './tools/ServerErrorCode'

import { UploadError } from './tools/UploadError'
/** @deprecated Please use UploadError instead. */
export const UploadClientError = UploadError

export { Settings, SupportedFileInput as SupportedFileInput } from './types'
export {
  NodeFile as NodeFile,
  BrowserFile as BrowserFile,
  ReactNativeAsset,
  Sliceable
} from './types'
export {
  FileInfo,
  GroupId,
  GroupInfo,
  GroupFileInfo,
  Token,
  Url,
  Uuid,
  ProgressCallback,
  ComputableProgressInfo,
  UnknownProgressInfo
} from './api/types'
export { isReadyPoll, IsReadyPoolOptions } from './tools/isReadyPoll'
