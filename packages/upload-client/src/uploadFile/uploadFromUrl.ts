import fromUrlStatus, { Status } from '../api/fromUrlStatus'
import fromUrl, { TypeEnum, FromUrlOptions } from '../api/fromUrl'
import { UploadError } from '../tools/UploadError'
import { race } from '../tools/race'
import { isReadyPoll } from '../tools/isReadyPoll'
import defaultSettings from '../defaultSettings'
import { getPusher, preconnect } from './pusher'

import {
  CustomUserAgent,
  onCancel,
  CancelError,
  poll
} from '@uploadcare/api-client-utils'
import { UploadcareFile } from '../tools/UploadcareFile'
import { FileInfo, ProgressCallback } from '../api/types'

function pollStrategy({
  token,
  publicKey,
  baseURL,
  integration,
  userAgent,
  retryThrottledRequestMaxTimes,
  retryNetworkErrorMaxTimes,
  onProgress,
  signal
}: {
  token: string
  publicKey: string
  baseURL?: string
  integration?: string
  userAgent?: CustomUserAgent
  retryThrottledRequestMaxTimes?: number
  retryNetworkErrorMaxTimes?: number
  onProgress?: ProgressCallback
  signal?: AbortSignal
}): Promise<FileInfo | UploadError> {
  return poll<FileInfo | UploadError>({
    check: (signal) =>
      fromUrlStatus(token, {
        publicKey,
        baseURL,
        integration,
        userAgent,
        retryThrottledRequestMaxTimes,
        retryNetworkErrorMaxTimes,
        signal
      }).then((response) => {
        switch (response.status) {
          case Status.Error: {
            return new UploadError(response.error, response.errorCode)
          }
          case Status.Waiting: {
            return false
          }
          case Status.Unknown: {
            return new UploadError(`Token "${token}" was not found.`)
          }
          case Status.Progress: {
            if (onProgress) {
              if (response.total === 'unknown') {
                onProgress({ isComputable: false })
              } else {
                onProgress({
                  isComputable: true,
                  value: response.done / response.total
                })
              }
            }
            return false
          }
          case Status.Success: {
            if (onProgress)
              onProgress({
                isComputable: true,
                value: response.done / response.total
              })
            return response
          }
          default: {
            throw new Error('Unknown status')
          }
        }
      }),
    signal
  })
}

export type UploadFromUrlOptions = {
  baseCDN?: string
  onProgress?: ProgressCallback
  pusherKey?: string
} & FromUrlOptions

const pushStrategy = ({
  token,
  pusherKey,
  signal,
  onProgress
}: {
  token: string
  pusherKey: string
  signal: AbortSignal
  onProgress?: ProgressCallback
}): Promise<FileInfo | UploadError> =>
  new Promise((resolve, reject) => {
    const pusher = getPusher(pusherKey)
    const unsubErrorHandler = pusher.onError(reject)
    const destroy = (): void => {
      unsubErrorHandler()
      pusher.unsubscribe(token)
    }

    onCancel(signal, () => {
      destroy()
      reject(new CancelError('pusher cancelled'))
    })

    pusher.subscribe(token, (result) => {
      switch (result.status) {
        case Status.Progress: {
          if (onProgress) {
            if (result.total === 'unknown') {
              onProgress({ isComputable: false })
            } else {
              onProgress({
                isComputable: true,
                value: result.done / result.total
              })
            }
          }
          break
        }

        case Status.Success: {
          destroy()
          if (onProgress)
            onProgress({
              isComputable: true,
              value: result.done / result.total
            })
          resolve(result)
          break
        }

        case Status.Error: {
          destroy()
          reject(new UploadError(result.msg, result.error_code))
        }
      }
    })
  })

export const uploadFromUrl = (
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
    signal,
    onProgress,
    source,
    integration,
    userAgent,
    retryThrottledRequestMaxTimes,
    pusherKey = defaultSettings.pusherKey,
    metadata
  }: UploadFromUrlOptions
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
        signal,
        source,
        integration,
        userAgent,
        retryThrottledRequestMaxTimes,
        metadata
      })
    )
    .catch((error) => {
      const pusher = getPusher(pusherKey)
      pusher?.disconnect()
      return Promise.reject(error)
    })
    .then((urlResponse) => {
      if (urlResponse.type === TypeEnum.FileInfo) {
        return urlResponse
      } else {
        return race<FileInfo | UploadError>(
          [
            ({ signal }): Promise<FileInfo | UploadError> =>
              pollStrategy({
                token: urlResponse.token,
                publicKey,
                baseURL,
                integration,
                userAgent,
                retryThrottledRequestMaxTimes,
                onProgress,
                signal
              }),
            ({ signal }): Promise<FileInfo | UploadError> =>
              pushStrategy({
                token: urlResponse.token,
                pusherKey,
                signal,
                onProgress
              })
          ],
          { signal }
        )
      }
    })
    .then((result) => {
      if (result instanceof UploadError) throw result

      return result
    })
    .then((result) =>
      isReadyPoll(result.uuid, {
        publicKey,
        baseURL,
        integration,
        userAgent,
        retryThrottledRequestMaxTimes,
        onProgress,
        signal
      })
    )
    .then((fileInfo) => new UploadcareFile(fileInfo, { baseCDN }))
