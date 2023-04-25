import { ConversionType } from './ConversionType'
import { StoreValue } from '@uploadcare/api-client-utils'
import { ValueOf } from './ValueOf'

export type ConversionOptions<T extends ValueOf<typeof ConversionType>> = {
  type: T
  paths: string[]
  store?: StoreValue
}
