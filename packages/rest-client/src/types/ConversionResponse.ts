import { ConversionResult } from './ConversionResult'
import { Problems } from './Problems'

export type ConversionResponse<T extends ConversionResult = ConversionResult> =
  {
    problems: Problems
    result: T[]
  }
