import { AuthSchema } from './auth/types'

export interface Settings {
  apiBaseURL?: string
  authSchema?: AuthSchema | null
  retryThrottledRequestMaxTimes?: number
}

export const defaultSettings: Required<Settings> = {
  apiBaseURL: 'https://api.uploadcare.com/',
  retryThrottledRequestMaxTimes: 5,
  authSchema: null
}
