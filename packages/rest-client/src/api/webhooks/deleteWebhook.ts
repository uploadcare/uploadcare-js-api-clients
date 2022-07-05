import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { Webhook } from '../../types/Webhook'
import { handleApiRequest } from '../handleApiRequest'

export type DeleteWebhookOptions = Pick<Webhook, 'targetUrl'>

export type DeleteWebhookResponse = void

export async function deleteWebhook(
  options: DeleteWebhookOptions,
  userSettings: ApiRequestSettings
): Promise<DeleteWebhookResponse> {
  const apiRequest = await makeApiRequest(
    {
      method: 'DELETE',
      path: `/webhooks/unsubscribe/`,
      body: {
        target_url: options.targetUrl
      }
    },
    userSettings
  )

  return handleApiRequest({ apiRequest, okCodes: [204] })
}
