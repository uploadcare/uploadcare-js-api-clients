import { ConversionStatus } from './ConversionStatus'
import { ConversionStatusResult } from './ConversionStatusResult'
import { ValueOf } from './ValueOf'

export type ConversionStatusResponse<
  T extends ValueOf<ConversionStatusResult>
> = {
  status: ConversionStatus
  error: string | null
  result: T | null
}
