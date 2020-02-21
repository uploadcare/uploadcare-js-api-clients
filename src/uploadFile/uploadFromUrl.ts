import fromUrl, { TypeEnum } from '../api/fromUrl'
import { UploadClientError } from '../tools/errors'
import { race } from '../tools/race'
import defaultSettings from '../defaultSettings'

import poll from './pollStrategy'
import push, { preconnect } from './pushStrategy'

/* Types */
import { FileInfo } from '../api/types'
import CancelController from '../tools/CancelController'
import { UploadcareFile } from '../tools/UploadcareFile'

type FromUrlOptions = {
  publicKey: string
  fileName?: string
  baseURL?: string
  baseCDN?: string
  checkForUrlDuplicates?: boolean
  saveUrlForRecurrentUploads?: boolean
  secureSignature?: string
  secureExpire?: string
  store?: boolean
  cancel?: CancelController
  onProgress?: ({ value: number }) => void
  source?: string
  integration?: string
  retryThrottledRequestMaxTimes?: number
  pusherKey?: string
}

const uploadFromUrl = (
  sourceUrl: string,
  {
    publicKey,
    fileName,
    baseURL,
    baseCDN,
    checkForUrlDuplicates,
    saveUrlForRecurrentUploads,
    secureSignature,
    secureExpire,
    store,
    cancel,
    onProgress,
    source,
    integration,
    retryThrottledRequestMaxTimes,
    pusherKey = defaultSettings.pusherKey
  }: FromUrlOptions
): Promise<UploadcareFile> =>
  Promise.resolve(preconnect(pusherKey))
    .then(() =>
      fromUrl(sourceUrl, {
        publicKey,
        fileName,
        baseURL,
        checkForUrlDuplicates,
        saveUrlForRecurrentUploads,
        secureSignature,
        secureExpire,
        store,
        cancel,
        source,
        integration,
        retryThrottledRequestMaxTimes
      })
    )
    .then(urlResponse => {
      if (urlResponse.type === TypeEnum.FileInfo) {
        return urlResponse
      } else {
        return race<FileInfo | UploadClientError>(
          [
            ({ cancel }): Promise<FileInfo | UploadClientError> =>
              poll({
                token: urlResponse.token,
                publicKey,
                baseURL,
                integration,
                retryThrottledRequestMaxTimes,
                onProgress,
                cancel
              }),
            ({ stopRace, cancel }): Promise<FileInfo | UploadClientError> =>
              push({
                token: urlResponse.token,
                pusherKey,
                stopRace,
                cancel,
                onProgress
              }).then(() =>
                poll({
                  token: urlResponse.token,
                  publicKey,
                  baseURL,
                  integration,
                  retryThrottledRequestMaxTimes,
                  onProgress,
                  cancel
                })
              )
          ],
          { cancel }
        )
      }
    })
    .then(result => {
      if (result instanceof UploadClientError) throw result

      return result
    })
    .then(fileInfo => new UploadcareFile(fileInfo, { baseCDN }))

export default uploadFromUrl
