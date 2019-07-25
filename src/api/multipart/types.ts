import {FileInfo, Uuid} from '../types'

export type MultipartCompleteResponse = FileInfo

export type MultipartPart = string

export type MultipartStartResponse = {
  parts: MultipartPart[],
  uuid: Uuid,
}

export type MultipartUploadResponse = {
  code: number,
}

export type ChunkType = [number, number]
