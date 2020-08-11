import { AbortController } from 'abort-controller'

import UploadClient from './UploadClient'

import base from './api/base'
import fromUrl from './api/fromUrl'
import fromUrlStatus from './api/fromUrlStatus'
import group from './api/group'
import groupInfo from './api/groupInfo'
import info from './api/info'
import multipartStart from './api/multipartStart'
import multipartUpload from './api/multipartUpload'
import multipartComplete from './api/multipartComplete'

import uploadFile from './uploadFile'
import uploadFileGroup from './uploadFileGroup'

/* Types */
export { Settings } from './types'
export { NodeFile, BrowserFile } from './request/types'
export { BaseOptions, BaseResponse } from './api/base'
export { FileInfo, GroupId, GroupInfo, Token, Url, Uuid } from './api/types'
export { InfoOptions } from './api/info'
export { FromUrlOptions, FromUrlResponse } from './api/fromUrl'
export {
  FromUrlStatusOptions,
  FromUrlStatusResponse
} from './api/fromUrlStatus'
export { GroupOptions } from './api/group'
export { GroupInfoOptions } from './api/groupInfo'
export {
  MultipartStartOptions,
  MultipartStartResponse,
  MultipartPart
} from './api/multipartStart'
export { MultipartCompleteOptions } from './api/multipartComplete'
export {
  MultipartUploadOptions,
  MultipartUploadResponse
} from './api/multipartUpload'
export { FileFromOptions } from './uploadFile'
export { GroupFromOptions } from './uploadFileGroup'

/* Middle-Level API */
export {
  base,
  fromUrl,
  fromUrlStatus,
  group,
  groupInfo,
  info,
  multipartStart,
  multipartUpload,
  multipartComplete
}

/* High-Level API */
export { uploadFile, uploadFileGroup }

/* Helpers */
export { AbortController }

export { UploadClient }
