import { ContentInfo, Metadata } from '@uploadcare/api-client-utils'
import { AppData } from './AppData'

// TODO: ensure that it's proper type
export type FileInfoVariations = string[]

export type FileInfo = {
  datetimeRemoved: string | null
  datetimeStored: string | null
  datetimeUploaded: string
  isImage: boolean
  isReady: boolean
  mimeType: string
  originalFileUrl: string | null
  originalFilename: string
  size: number
  url: string
  uuid: string
  variations: FileInfoVariations | null
  contentInfo: ContentInfo | null
  metadata: Metadata | null
  appdata: AppData | null
}
