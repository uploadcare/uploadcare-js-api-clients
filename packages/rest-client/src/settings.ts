import { AuthSchema } from './auth/types'

export interface Settings {
  apiBaseURL?: string
  authSchema?: AuthSchema | null
}

export const defaultSettings: Required<Settings> = {
  apiBaseURL: 'https://api.uploadcare.com/',
  authSchema: null
}
