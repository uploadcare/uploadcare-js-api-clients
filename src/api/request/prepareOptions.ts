import {getUserAgent} from '../../defaultSettings'

/* Types */
import {RequestOptions} from './types'
import {SettingsInterface} from '../../types'

/**
 * Updates options with Uploadcare SettingsInterface.
 *
 * @param {RequestOptions} options
 * @param {SettingsInterface} settings
 * @returns {RequestOptions}
 */
export function prepareOptions(options: RequestOptions, settings: SettingsInterface): RequestOptions {
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
