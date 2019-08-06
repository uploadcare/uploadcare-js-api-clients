import {getUserAgent} from '../../defaultSettings'

/* Types */
import {RequestOptionsInterface} from './types'
import {SettingsInterface} from '../../types'

/**
 * Updates options with Uploadcare SettingsInterface.
 *
 * @param {RequestOptionsInterface} options
 * @param {SettingsInterface} settings
 * @returns {RequestOptionsInterface}
 */
export function prepareOptions(options: RequestOptionsInterface, settings: SettingsInterface): RequestOptionsInterface {
  const newOptions = {...options}

  if (!options.baseURL && settings.baseURL) {
    newOptions.baseURL = settings.baseURL
  }

  if (settings.integration) {
    newOptions.headers = {
      ...newOptions.headers,
      'X-UC-User-Agent': getUserAgent(settings),
    }
  }

  return newOptions
}
