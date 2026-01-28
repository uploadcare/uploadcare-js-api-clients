import { TelemetryRequest } from '../types/telemetry'

type SafeParseReturnType =
  | {
      success: true
      data: TelemetryRequest
    }
  | {
      success: false
      error: unknown
    }

export const safeParseAsync = async (
  _schema: unknown,
  data: TelemetryRequest
): Promise<SafeParseReturnType> => {
  return { success: true, data }
}
