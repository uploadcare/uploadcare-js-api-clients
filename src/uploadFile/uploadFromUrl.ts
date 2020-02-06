import fromUrl, { TypeEnum } from '../api/fromUrl'

import CancelController from '../tools/CancelController'
import { UploadcareFile } from '../tools/UploadcareFile'
import { race } from '../tools/race'
import poll from './poller'
import push from './pusher'
import { FileInfo } from '../api/types'

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
    .then(urlResponse => {
      if (urlResponse.type === TypeEnum.FileInfo) {
        return urlResponse
      } else {
        return race<FileInfo>(
          [
            ({ cancel }): Promise<FileInfo> =>
              poll({
                token: urlResponse.token,
                publicKey,
                baseURL,
                integration,
                retryThrottledRequestMaxTimes,
                onProgress,
                cancel
              }),
            ({ callback, cancel }): Promise<FileInfo> =>
              push({
                token: urlResponse.token,
                callback,
                cancel,
                onProgress
              })
          ],
          { cancel }
        )
      }
    })
    .then(fileInfo => new UploadcareFile(fileInfo, { baseCDN }))

export default uploadFromUrl
