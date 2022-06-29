import { apiRequest, ApiRequestSettings } from '../../apiRequest'
import { Webhook } from '../../types/Webhook'
import { handleResponse } from '../handleResponse'

export type CreateWebhookOptions = Pick<Webhook, 'targetUrl' | 'event'> &
  Partial<Pick<Webhook, 'isActive' | 'signingSecret' | 'version'>>

export type CreateWebhookResponse = Webhook

export async function createWebhook(
  options: CreateWebhookOptions,
  userSettings: ApiRequestSettings
): Promise<CreateWebhookResponse> {
  const response = await apiRequest(
    {
      method: 'POST',
      path: `/webhooks/`,
      body: {
        target_url: options.targetUrl,
        event: options.event,
        is_active: options.isActive,
        signing_secret: options.signingSecret
      }
    },
    userSettings
  )
  return handleResponse({ response, okCodes: [201] })
}
