import { cancelError } from '../../errors/errors'
import { RequestOptions } from './types'
import { BaseResponse } from '../base'

const request = ({
  method,
  url,
  data,
  headers = {},
  cancel,
  onProgress
}: RequestOptions): Promise<BaseResponse> =>
  new Promise((resolve, reject) => {
    // 1. Create a new XMLHttpRequest object
    const xhr = new XMLHttpRequest()
    let aborted = false

    // 2. Configure it
    xhr.open(method || 'GET', url)

    if (headers) {
      Object.entries(headers).forEach(entry => {
        const [key, value] = entry
        typeof value !== 'undefined' &&
          !Array.isArray(value) &&
          xhr.setRequestHeader(key, value)
      })
    }

    xhr.responseType = 'json'

    // 3. Send the request over the network
    if (data) {
      xhr.send(data as FormData)
    } else {
      xhr.send()
    }

    // 4. This will be called after the response is received
    xhr.onload = (): void => {
      if (xhr.status != 200) {
        // analyze HTTP status of the response
        reject(new Error(`Error ${xhr.status}: ${xhr.statusText}`)) // e.g. 404: Not Found
      } else {
        // show the result
        resolve(xhr.response)
      }
    }

    xhr.onerror = (): void => {
      if (aborted) return

      // only triggers if the request couldn't be made at all
      reject(new Error('Network error'))
    }

    if (onProgress && typeof onProgress === 'function') {
      xhr.onprogress = (event: ProgressEvent): void => {
        const value = Math.round(event.loaded / event.total)
        onProgress(value)
      }
    }

    if (cancel) {
      cancel.onCancel(() => {
        aborted = true
        xhr.abort()

        reject(cancelError())
      })
    }
  })

export default request
