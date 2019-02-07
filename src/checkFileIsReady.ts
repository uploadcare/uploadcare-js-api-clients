import info from './api/info'
import {Settings} from './types'
import {InfoResponse} from './api/info'

const MAX_TIMEOUT = 300

/**
 * Resolves then file on CDN get status "ready".
 *
 * @param uuid
 * @param handleFileInfo
 * @param timeout
 * @param settings
 * @returns {Promise<void>}
 */
export default function checkFileIsReady(
  uuid: string,
  handleFileInfo: null | ((info: InfoResponse) => void),
  timeout: number,
  settings: Settings = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    info(uuid, settings)
      .then(data => {
        if (typeof handleFileInfo === 'function') {
          handleFileInfo(data)
        }

        if (data.is_ready) {
          resolve()
        }

        setTimeout(() => {
          checkFileIsReady(uuid, handleFileInfo, Math.min(MAX_TIMEOUT, timeout + 50), settings)
            .then(() => {
              resolve()
            })
            .catch((error) => {
              reject(error)
            })
        }, timeout)
      })
      .catch((error) => {
        reject(error)
      })
  })
}
