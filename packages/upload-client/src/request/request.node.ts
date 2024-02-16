import NodeFormData from 'form-data'

import http from 'http'
import https from 'https'
import { Readable, Transform, TransformCallback } from 'stream'
import { parse } from 'url'

import { CancelError, onCancel } from '@uploadcare/api-client-utils'
import { ProgressCallback } from '../api/types'
import { SupportedFileInput } from '../types'
import { RequestOptions, RequestResponse } from './types'

// ProgressEmitter is a simple PassThrough-style transform stream which keeps
// track of the number of bytes which have been piped through it and will
// invoke the `onprogress` function whenever new number are available.
class ProgressEmitter extends Transform {
  private readonly _onprogress: ProgressCallback
  private _position: number
  private readonly size: number

  constructor(onProgress: ProgressCallback, size: number) {
    super()

    this._onprogress = onProgress
    this._position = 0
    this.size = size
  }

  _transform(
    chunk: Buffer,
    encoding: BufferEncoding,
    callback: TransformCallback
  ): void {
    this._position += chunk.length
    this._onprogress({
      isComputable: true,
      value: this._position / this.size
    })
    callback(null, chunk)
  }
}

const getLength = (formData: NodeFormData): Promise<number> =>
  new Promise<number>((resolve, reject) => {
    formData.getLength((error, length) => {
      if (error) reject(error)
      else resolve(length)
    })
  })

function isFormData(
  formData?: NodeFormData | FormData | SupportedFileInput
): formData is NodeFormData {
  if (formData && formData.toString() === '[object FormData]') {
    return true
  }

  return false
}

function isReadable(
  data?: Readable | NodeFormData | FormData | SupportedFileInput,
  isFormData?: boolean
): data is Readable {
  if (data && (data instanceof Readable || isFormData)) {
    return true
  }

  return false
}

const request = (params: RequestOptions): Promise<RequestResponse> => {
  const { method = 'GET', url, data, headers = {}, signal, onProgress } = params

  return Promise.resolve()
    .then(() => {
      if (isFormData(data)) {
        return getLength(data)
      } else {
        return undefined
      }
    })
    .then(
      (length) =>
        new Promise((resolve, reject) => {
          const isFormData = !!length
          let aborted = false
          const options: http.RequestOptions = parse(url)

          options.method = method
          options.headers = isFormData
            ? Object.assign((data as NodeFormData).getHeaders(), headers)
            : headers

          if (isFormData || (data && (data as Buffer).length)) {
            options.headers['Content-Length'] =
              length || (data as Buffer).length
          }

          const req =
            options.protocol !== 'https:'
              ? http.request(options)
              : https.request(options)

          onCancel(signal, () => {
            aborted = true
            req.abort()

            reject(new CancelError())
          })

          req.on('response', (res) => {
            if (aborted) return

            const resChunks: Uint8Array[] = []

            res.on('data', (data) => {
              resChunks.push(data)
            })

            res.on('end', () =>
              resolve({
                data: Buffer.concat(resChunks).toString('utf8'),
                status: res.statusCode,
                headers: res.headers,
                request: params
              })
            )
          })

          req.on('error', (err) => {
            if (aborted) return

            reject(err)
          })

          if (isReadable(data, isFormData)) {
            if (onProgress && length) {
              data.pipe(new ProgressEmitter(onProgress, length)).pipe(req)
            } else {
              data.pipe(req)
            }
          } else {
            req.end(data)
          }
        })
    )
}

export default request
