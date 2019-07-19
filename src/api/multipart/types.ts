import {CancelableInterface, FileInfo, Uuid} from '../types'
import {HandleProgressFunction} from '../request/types'

export type MultipartCompleteResponse = FileInfo

export type MultipartPart = string

export type MultipartStartResponse = {
  parts: MultipartPart[],
  uuid: Uuid,
}

export type MultipartUploadResponse = {
  code: number,
}

export interface MultipartUploadInterface extends Promise<MultipartUploadResponse>, CancelableInterface {
  onProgress: HandleProgressFunction | null
  onCancel: VoidFunction | null
}

export type ChunkType = [number, number]
