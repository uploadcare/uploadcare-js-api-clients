/* @flow */
import info from './api/info'
import type {Settings} from './types'
import type {InfoResponse} from './api/info'

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
  handleFileInfo: (InfoResponse) => void | null,
  timeout: number,
  settings: Settings = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    info(uuid, settings)
      .then(fileInfo => {
        if (typeof handleFileInfo === 'function') {
          handleFileInfo(fileInfo)
        }

        if (fileInfo.is_ready) {
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
