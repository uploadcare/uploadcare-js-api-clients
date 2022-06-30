import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { Webhook } from '../../types/Webhook'
import { handleResponse } from '../handleResponse'

export type UpdateWebhookOptions = Pick<Webhook, 'id'> &
  Partial<Pick<Webhook, 'targetUrl' | 'event' | 'isActive' | 'signingSecret'>>
export type UpdateWebhookResponse = Webhook

export async function updateWebhook(
  options: UpdateWebhookOptions,
  userSettings: ApiRequestSettings
): Promise<UpdateWebhookResponse> {
  const response = await apiRequest(
    {
      method: 'PUT',
      path: `/webhooks/${options.id}/`,
      body: {
        target_url: options.targetUrl,
        event: options.event,
        is_active: options.isActive,
        signing_secret: options.signingSecret
      }
    },
    userSettings
  )
  return handleResponse({ response, okCodes: [200] })
}
