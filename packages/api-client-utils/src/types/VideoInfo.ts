type AudioInfo = {
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
