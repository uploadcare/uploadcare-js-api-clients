import { CustomUserAgent } from '@uploadcare/api-client-utils'
import { AuthSchema } from './auth/types'

export type UserSettings = {
  authSchema: AuthSchema
  apiBaseURL?: string
  retryThrottledRequestMaxTimes?: number
  integration?: string
  userAgent?: CustomUserAgent
}

export type DefaultSettings = Required<
  Pick<UserSettings, 'apiBaseURL' | 'retryThrottledRequestMaxTimes'>
>

export const defaultSettings: DefaultSettings = {
  apiBaseURL: 'https://api.uploadcare.com/',
  retryThrottledRequestMaxTimes: 5
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
