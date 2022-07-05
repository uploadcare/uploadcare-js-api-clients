import { makeApiRequest, ApiRequestSettings } from '../../makeApiRequest'
import { Webhook } from '../../types/Webhook'
import { handleApiRequest } from '../handleApiRequest'

export type CreateWebhookOptions = Pick<Webhook, 'targetUrl' | 'event'> &
  Partial<Pick<Webhook, 'isActive' | 'signingSecret' | 'version'>>

export type CreateWebhookResponse = Webhook

export async function createWebhook(
  options: CreateWebhookOptions,
  userSettings: ApiRequestSettings
): Promise<CreateWebhookResponse> {
  const apiRequest = await makeApiRequest(
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
  return handleApiRequest({ apiRequest, okCodes: [201] })
}
