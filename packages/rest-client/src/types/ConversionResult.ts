import { ConversionType } from './ConversionType'

export interface ConversionResultBase {
  originalSource: string
  uuid: string
  token: number
}

export type ConversionResultDocument = ConversionResultBase
export interface ConversionResultVideo extends ConversionResultBase {
  thumbnailsGroupUuid: string
}

export type ConversionResult = {
  [ConversionType.VIDEO]: ConversionResultVideo
  [ConversionType.DOCUMENT]: ConversionResultDocument
}
