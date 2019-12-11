export type GeoLocation = {
  latitude: number
  longitude: number
}

export type ImageInfo = {
  height: number
  width: number
  geoLocation: GeoLocation | null
  datetimeOriginal: string
  format: string
  colorMode: string
  dpi: number[] | null // wrong type
  orientation: number | null
  sequence: boolean | null
}

export type AudioInfo = {
  bitrate: number | null
  codec: string | null
  sampleRate: number | null
  channels: string | null
}

export type VideoInfo = {
  duration: number
  format: string
  bitrate: number
  audio: AudioInfo | null
  video: {
    height: number
    width: number
    frameRate: number
    bitrate: number
    codec: string
  }
}

export type FileInfo = {
  size: number
  done: number
  total: number

  uuid: Uuid
  fileId: Uuid
  originalFilename: string
  filename: string
  mimeType: string
  isImage: string
  isStored: string
  isReady: string
  imageInfo: ImageInfo | null
  videoInfo: VideoInfo | null
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
