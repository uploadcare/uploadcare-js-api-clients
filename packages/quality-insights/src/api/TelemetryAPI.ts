import { BaseAPIService } from './BaseService'
import { parseTelemetryRequest } from '../shared/lib/parseTelemetryRequest'
import { TelemetryRequest } from '../shared/types/telemetry'

export class TelemetryAPIService extends BaseAPIService {
  constructor() {
    super()
  }

  public async sendEvent(body: TelemetryRequest, options?: RequestInit) {
    const parseResult = await parseTelemetryRequest(body)

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
