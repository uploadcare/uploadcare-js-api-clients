import { ConversionStatus } from './ConversionStatus'
import { ConversionStatusResult } from './ConversionStatusResult'

export type ConversionStatusResponse<T extends ConversionStatusResult> = {
  status: ConversionStatus
  error: string | null
  result: T | null
}
