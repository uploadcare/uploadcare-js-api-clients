import { WebhookEvent } from './WebhookEvent'

export type Webhook = {
  id: number
  project: number
  created: string
  updated: string
  event: WebhookEvent
  targetUrl: string
  isActive: boolean
  signingSecret: string
  version: string
}
