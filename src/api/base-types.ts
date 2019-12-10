export type GeoLocation = {
  latitude: number;
  longitude: number;
}

export interface ImageInfo {
  height: number;
  width: number;
  geoLocation: GeoLocation | null;
  datetimeOriginal: string;
  format: string;
  colorMode: string;
  dpi?: number[]; // wrong type
  orientation: number | null;
  sequence: boolean | null;
}

export interface AudioInterface {
  bitrate: number | null;
  codec: string | null;
  sampleRate: number | null;
  channels: string | null;
}

export interface VideoInterface {
  height: number;
  width: number;
  frameRate: number;
  bitrate: number;
  codec: string;
}

export type VideoInfo = {
  duration: number;
  format: string;
  bitrate: number;
  audio?: AudioInterface;
  video: VideoInterface;
}

export type FileInfo = {
  uuid: Uuid;
  fileId: Uuid;
  originalFilename: string;
  filename: string;
  mimeType: string;
  isImage: string;
  isStore: string;
  isReady: string;
  imageInfo: ImageInfo | null;
  videoInfo: VideoInfo | null;
}

// {
//   status: 'success',
//   uuid: '103509fe-43ee-4dfc-8b03-8c54173f4af0',
//   isImage: true,
//   filename: 'imagefromunsplash',
//   videoInfo: null,
//   isStored: false,
//   done: 2224724,
//   fileId: '103509fe-43ee-4dfc-8b03-8c54173f4af0',
//   originalFilename: 'image-from-unsplash',
//   imageInfo: {
//     colorMode: 'RGB',
//     orientation: null,
//     format: 'JPEG',
//     sequence: false,
//     height: 4101,
//     width: 2734,
//     geoLocation: null,
//     datetimeOriginal: null,
//     dpi: { '0': 72, '1': 72 }
//   },
//   isReady: true,
//   total: 2224724,
//   mimeType: 'image/jpeg',
//   size: 2224724
// }

export type GroupInfo = {
  datetimeCreated: string;
  datetimeStored: string | null;
  filesCount: string;
  cdnUrl: string;
  files: FileInfo[];
  url: string;
  id: GroupId;
}

export type Token = string

export type Uuid = string

export type GroupId = string
