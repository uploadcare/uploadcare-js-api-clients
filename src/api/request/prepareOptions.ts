import {getUserAgent} from '../../defaultSettings'

/* Types */
import {RequestOptions} from './types'
import {Settings} from '../../types'

/**
 * Updates options with Uploadcare Settings.
 *
 * @param {RequestOptions} options
 * @param {Settings} settings
 * @returns {RequestOptions}
 */
export function prepareOptions(options: RequestOptions, settings: Settings): RequestOptions {
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
