import { BaseAPIService } from './BaseService'
import {
  TelemetryRequest,
  TelemetryRequestSchema
} from '../shared/schema/telemetry'
import { safeParseAsync } from '../shared/lib/zod'

export class TelemetryAPIService extends BaseAPIService {
  constructor() {
    super()
  }

  public async sendEvent(body: TelemetryRequest, options?: RequestInit) {
    const parseResult = await safeParseAsync(
      import.meta.env.MODE === 'development'
        ? TelemetryRequestSchema
        : undefined,
      body
    )

    if (!parseResult.success) {
      console.error(
        'TelemetryAPIService: events: body is invalid',
        parseResult.error
      )
      throw new Error('TelemetryAPIService: events: body is invalid')
    }

    return this.post<unknown, TelemetryRequest>(`v1/events`, body, options)
  }
}
