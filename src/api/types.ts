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

interface FileInfoInterface extends ProgressInterface, ImageInfoInterface, VideoInfoInterface {
  uuid: string,
  file_id: string,
  original_filename: string,
  filename: string,
  mime_type: string,
  is_image: string,
  is_store: string,
  is_ready: string,
}

export type FileInfo = FileInfoInterface
