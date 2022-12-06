import { ConversionResult } from './ConversionResult'
import { Problems } from './Problems'
import { ValueOf } from './ValueOf'

export type ConversionResponse<T extends ValueOf<ConversionResult>> = {
  problems: Problems
  result: T[]
}
