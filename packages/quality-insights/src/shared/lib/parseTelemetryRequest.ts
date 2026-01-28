import { TelemetryRequest } from '../types/telemetry'
import { safeParseAsync as safeParseAsyncProd } from './zod.prod'

export const parseTelemetryRequest = async (body: TelemetryRequest) => {
  if (import.meta.env.MODE === 'development') {
    const { TelemetryRequestSchema } = await import('../schema/telemetry.dev')
    const safeParseAsync = await import('./zod.dev').then(
      (mod) => mod.safeParseAsync
    )
    return safeParseAsync(TelemetryRequestSchema, body)
  } else {
    return safeParseAsyncProd(undefined, body)
  }
}
