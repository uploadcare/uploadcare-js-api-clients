import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { Webhook } from '../../types/Webhook'
import { handleResponse } from '../handleResponse'

export type ListOfWebhooksOptions = Record<string, never>

export type ListOfWebhooksResponse = Webhook[]

export async function listOfWebhooks(
  options: ListOfWebhooksOptions,
  userSettings: ApiRequestSettings
): Promise<ListOfWebhooksResponse> {
  const response = await apiRequest(
    {
      method: 'GET',
      path: `/webhooks/`
    },
    userSettings
  )
  return handleResponse({ response, okCodes: [200] })
}
