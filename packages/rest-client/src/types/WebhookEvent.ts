enum WebhookEventEnum {
  'file.uploaded'
}
export type WebhookEvent = keyof typeof WebhookEventEnum
