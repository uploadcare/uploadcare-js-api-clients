import * as z from 'zod'
import type { TelemetryRequest, TelemetryResponse } from '../types/telemetry'

export const TelemetryRequestSchema: z.ZodType<TelemetryRequest> = z.object({
  eventType: z.string().nullable(),
  activity: z.string().nullable(),
  projectPubkey: z.string(),
  appVersion: z.string(),
  appName: z.string(),
  sessionId: z.string(),
  component: z.string().nullable(),
  userAgent: z.string(),
  config: z.record(z.unknown()).nullable(),
  payload: z.record(z.unknown()).nullable()
})

export const TelemetryResponseSchema: z.ZodType<TelemetryResponse> = z.object({
  status: z.string(),
  message: z.string(),
  event_id: z.string()
})
