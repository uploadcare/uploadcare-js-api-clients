import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { Webhook } from '../../types/Webhook'
import { handleApiRequest } from '../handleApiRequest'

export type ListOfWebhooksOptions = Record<string, never>

export type ListOfWebhooksResponse = Webhook[]

export async function listOfWebhooks(
  options: ListOfWebhooksOptions,
  userSettings: ApiRequestSettings
): Promise<ListOfWebhooksResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'GET',
      path: `/webhooks/`
    },
    userSettings
  )
  return handleApiRequest({ apiRequest, okCodes: [200] })
}
