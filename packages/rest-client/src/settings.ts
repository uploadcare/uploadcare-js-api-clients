import { CustomUserAgent } from '@uploadcare/api-client-utils'
import { AuthSchema } from './auth/types'

export type UserSettings = {
  authSchema: AuthSchema
  apiBaseURL?: string
  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number
  integration?: string
  userAgent?: CustomUserAgent
}

export type DefaultSettings = Required<
  Pick<
    UserSettings,
    'apiBaseURL' | 'retryThrottledRequestMaxTimes' | 'retryNetworkErrorMaxTimes'
  >
>

export const defaultSettings: DefaultSettings = {
  apiBaseURL: 'https://api.uploadcare.com/',
  retryThrottledRequestMaxTimes: 5,
  retryNetworkErrorMaxTimes: 3
}

export const applyDefaultSettings = (
  userSettings: UserSettings
): UserSettings & DefaultSettings => {
  const settings = {
    ...defaultSettings,
    ...userSettings
  }
  return settings
}
