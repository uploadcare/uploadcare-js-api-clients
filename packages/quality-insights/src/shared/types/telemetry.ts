export type TelemetryRequest = {
  eventType: string | null
  activity: string | null
  projectPubkey: string
  appVersion: string
  appName: string
  sessionId: string
  component: string | null
  userAgent: string
  config: Record<string, unknown> | null
  payload: Record<string, unknown> | null
}

export type TelemetryResponse = {
  status: string
  message: string
  event_id: string
}
