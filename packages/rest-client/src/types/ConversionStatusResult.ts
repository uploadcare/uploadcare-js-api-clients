import { ConversionType } from './ConversionType'

export interface ConversionStatusResultBase {
  uuid: string
}

export type ConversionStatusResultDocument = ConversionStatusResultBase
export interface ConversionStatusResultVideo
  extends ConversionStatusResultBase {
  thumbnailsGroupUuid: string
}

export type ConversionStatusResult = {
  [ConversionType.VIDEO]: ConversionStatusResultVideo
  [ConversionType.DOCUMENT]: ConversionStatusResultDocument
}
