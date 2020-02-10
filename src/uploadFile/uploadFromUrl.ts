import fromUrl, { TypeEnum } from '../api/fromUrl'

import CancelController from '../tools/CancelController'
import { UploadcareFile } from '../tools/UploadcareFile'
import { race } from '../tools/race'
import poll from './poller'
import push, { preconnect } from './pusher'
import { FileInfo } from '../api/types'
import { UploadClientError } from '../tools/errors'

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
    retryThrottledRequestMaxTimes
  }: FromUrlOptions
): Promise<UploadcareFile> =>
  Promise.resolve(preconnect())
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
            ({ callback, cancel }): Promise<FileInfo | UploadClientError> =>
              push({
                token: urlResponse.token,
                callback,
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
      console.log(result)
      return result
    })
    .then(fileInfo => new UploadcareFile(fileInfo, { baseCDN }))

export default uploadFromUrl
