import { ImageInfo } from './ImageInfo'
import { VideoInfo } from './VideoInfo'

type MimeInfo = { mime: string; type: string; subtype: string }

export type ContentInfo = {
  mime?: MimeInfo
  image?: ImageInfo
  video?: VideoInfo
}
