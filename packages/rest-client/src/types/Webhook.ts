export type Webhook = {
  id: number
  project: number
  created: string
  updated: string
  event: 'file.uploaded' | string
  targetUrl: string
  isActive: boolean
  signingSecret: string
  version: string
}
