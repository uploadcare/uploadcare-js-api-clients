import { ConversionType } from './ConversionType'
import { ValueOf } from './ValueOf'

export type ConversionStatusOptions<T extends ValueOf<typeof ConversionType>> =
  {
    type: T
    token: number
  }
