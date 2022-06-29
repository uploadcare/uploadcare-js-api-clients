import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { Webhook } from '../../types/Webhook'
import { handleResponse } from '../handleResponse'

export type DeleteWebhookOptions = Pick<Webhook, 'targetUrl'>

export type DeleteWebhookResponse = void

export async function deleteWebhook(
  options: DeleteWebhookOptions,
  userSettings: ApiRequestSettings
): Promise<DeleteWebhookResponse> {
  const response = await apiRequest(
    {
      method: 'DELETE',
      path: `/webhooks/unsubscribe/`,
      body: {
        target_url: options.targetUrl
      }
    },
    userSettings
  )

  return handleResponse({ response, okCodes: [204] })
}
