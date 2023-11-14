import { ConversionType } from './ConversionType'
import { StoreValue } from '@uploadcare/api-client-utils'
import { ValueOf } from './ValueOf'

type BaseConversionOption<T> = {
  type: T
  paths: string[]
  store?: StoreValue
}

export type ConversionOptions<T extends ValueOf<typeof ConversionType>> =
  T extends ConversionType.VIDEO
    ? BaseConversionOption<T>
    : BaseConversionOption<T> & { saveInGroup?: boolean }
