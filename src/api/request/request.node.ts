import * as FormData from 'form-data'

import * as http from 'http'
import * as https from 'https'
import { parse } from 'url'
import { Readable, Transform } from 'stream'

import CancelController from '../../CancelController'

type Headers = {
  [key: string]: string | string[] | undefined
}

export type RequestOptions = {
  method?: string
  url: string
  query?: string
  data?: FormData
  headers?: Headers
  cancel?: CancelController
  onProgress?: (event: any) => void
}

export type RequestResponse = {
  data: string
  headers: Headers
  status?: number
}

export type FailedResponse = {
  error: {
    content: string
    statusCode: number
  }
}

// ProgressEmitter is a simple PassThrough-style transform stream which keeps
// track of the number of bytes which have been piped through it and will
// invoke the `onprogress` function whenever new number are available.
class ProgressEmitter extends Transform {
  private _onprogress: (evn: any) => void
  private _position: number

  constructor(onprogress) {
    super()

    this._onprogress = onprogress
    this._position = 0
  }

  _transform(chunk, encoding, callback): void {
    this._position += chunk.length
    this._onprogress({
      lengthComputable: true,
      loaded: this._position
    })
    callback(null, chunk)
  }
}

const getLength = (formData: FormData): Promise<number> =>
  new Promise<number>((resolve, reject) => {
    formData.getLength((error, length) => {
      if (error) reject(error)
      else resolve(length)
    })
  })

const request = ({
  method,
  url,
  data,
  headers = {},
  cancel,
  onProgress
}: RequestOptions): Promise<RequestResponse> =>
  Promise.resolve()
    .then(() => {
      if (data && data.toString() === '[object FormData]') {
        return getLength(data)
      } else {
        return undefined
      }
    })
    .then(
      length =>
        new Promise((resolve, reject) => {
          const isFormData = !!length
          let aborted = false
          const options: http.RequestOptions = parse(url)

          options.method = method
          options.headers = isFormData
            ? Object.assign((data as FormData).getHeaders(), headers)
            : headers

          if (isFormData) {
            options.headers['Content-Length'] = length
          }

          const req =
            options.protocol !== 'https:'
              ? http.request(options)
              : https.request(options)

          if (cancel) {
            cancel.onCancel(() => {
              aborted = true
              req.abort()

              reject(new Error('cancel'))
            })
          }

          req.on('response', res => {
            if (aborted) return

            const resChunks: any[] = []

            res.on('data', data => {
              resChunks.push(data)
            })

            res.on('end', () =>
              resolve({
                data: Buffer.concat(resChunks).toString('utf8'),
                status: res.statusCode,
                headers: res.headers
              })
            )
          })

          req.on('error', err => {
            if (aborted) return

            reject(err)
          })

          if (data && (data instanceof Readable || isFormData)) {
            if (onProgress) {
              data.pipe(new ProgressEmitter(onProgress)).pipe(req)
            } else {
              data.pipe(req)
            }
          } else {
            req.end(data)
          }
        })
    )

export default request
