import { ContentInfo, ImageInfo, VideoInfo } from '@uploadcare/api-client-utils'

export type FileInfo = {
  size: number
  done: number
  total: number

  uuid: Uuid
  fileId: Uuid
  originalFilename: string
  filename: string
  mimeType: string
  isImage: boolean
  isStored: boolean
  isReady: string
  imageInfo: ImageInfo | null
  videoInfo: VideoInfo | null
  contentInfo: ContentInfo | null
  s3Bucket?: string
  metadata?: Metadata
}

export type GroupInfo = {
  datetimeCreated: string
  datetimeStored: string | null
  filesCount: string
  cdnUrl: string
  files: FileInfo[]
  url: string
  id: GroupId
}

export type Token = string

export type Uuid = string

export type GroupId = string

export type Url = string

export type ComputableProgressInfo = {
  isComputable: true
  value: number
}

export type UnknownProgressInfo = {
  isComputable: false
}

export type ProgressCallback<T = ComputableProgressInfo | UnknownProgressInfo> =
  (arg: T) => void

export type Metadata = {
  [key: string]: string
}
