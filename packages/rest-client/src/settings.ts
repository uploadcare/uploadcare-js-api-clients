import { AuthSchema } from './auth/types'

export type UserSettings = {
  apiBaseURL?: string
  authSchema?: AuthSchema | null
  retryThrottledRequestMaxTimes?: number
}

export type Settings = Required<UserSettings>

export const defaultSettings: Settings = {
  apiBaseURL: 'https://api.uploadcare.com/',
  retryThrottledRequestMaxTimes: 5,
  authSchema: null
}
