/* @flow */
import info from './api/info'
import type {Settings, FileInfo} from './types'

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
  handleFileInfo: (FileInfo) => void,
  timeout: number,
  settings: Settings = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    info(uuid, settings)
      .then(fileInfo => {
        handleFileInfo(fileInfo)

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
