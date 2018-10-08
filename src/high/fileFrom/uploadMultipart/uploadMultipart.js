/* @flow */
/* eslint-disable require-jsdoc */

import type {
  FileData,
  UCFile,
  FileInfo,
  ProgressListener,
} from '../../../flow-typed'
import type {Options} from '../flow-typed'
import {extractInfo} from '../extractInfo'
import {makeError} from '../../../util/makeError'
import {multipartStart} from '../../../low/multipartStart/multipartStart'
import {multipartUpload} from '../../../low/multipartUpload/multipartUpload'
import type {MultipartUploadRequest} from '../../../low/multipartUpload/flow-typed'
import type {UCError} from '../../../flow-typed'
import {multipartComplete} from '../../../low/multipartComplete/multipartComplete'

function getParts(
  input: FileData,
  state: $Call<typeof makeState>,
  options: Options,
) {
  return (): Promise<{uuid: string, parts: Array<string>}> => {
    const fileInfo = state.get('fileInfo')

    return multipartStart({
      filename: fileInfo.filename,
      contentType: fileInfo.mime_type,
      size: fileInfo.size,
      ...options,
    }).then(({code, data}) => {
      if (code !== 200 || data.error) {
        return Promise.reject(
          makeError({
            type: 'MULTIPART_START_FAILED',
            payload: data,
          }),
        )
      }

      return data
    })
  }
}

function updateUuid(state: $Call<typeof makeState>) {
  return (response: {uuid: string, parts: Array<string>}) => {
    state.set('fileInfo', {
      ...state.get('fileInfo'),
      uuid: response.uuid,
    })

    return response
  }
}

function getChunks(fileSize: number): Array<[number, number]> {
  const chunkSize = 5242880
  const chunksCount = Math.ceil(fileSize / chunkSize)

  return Array.apply(null, Array(chunksCount)).map((val, idx) => {
    const start = 0 + (idx * chunkSize)
    const end = start + chunkSize

    return [start, end]
  })
}

function startUploadChunks(input: FileData, state: $Call<typeof makeState>) {
  return ({parts}: {parts: Array<string>}) => {
    const fileInfo = state.get('fileInfo')
    const chunks = getChunks(fileInfo.size)

    const requests = chunks.map(([start, end], idx) => {
      const url = parts[idx]

      return multipartUpload(url, input.slice(start, end))
    })

    const cancelUpload = () => requests.forEach(req => req.cancel())

    state.set('cancelUpload', cancelUpload)

    return requests
  }
}

function trackProgress(state: $Call<typeof makeState>) {
  return (requests: Array<MultipartUploadRequest>) => {
    const loadedPerChunk = requests.map(() => 0)

    const progressHandler = (idx: number) => ({loaded}) => {
      loadedPerChunk[idx] = loaded

      const sum = loadedPerChunk.reduce((a, b) => a + b, 0)
      const fileInfo = state.get('fileInfo')

      state.set('fileInfo', {
        ...fileInfo,
        loaded: sum,
      })

      state
        .get('progressListeners')
        .forEach((cb: ProgressListener) =>
          cb({
            loaded: sum,
            total: fileInfo.size,
          }),
        )
    }

    requests.forEach((req: MultipartUploadRequest, idx) => {
      req.progress(progressHandler(idx))
    })

    return requests
  }
}

function waitForUpload() {
  return (requests: Array<MultipartUploadRequest>) => {
    return Promise.all(
      requests.map(req =>
        req.promise.then(({code}: {code: number}) => {
          if (code !== 200) {
            return Promise.reject(makeError({type: 'CHUNK_UPLOAD_FAILED'}))
          }
        }),
      ),
    )
  }
}

function completeUpload(state: $Call<typeof makeState>, options: Options) {
  return () => {
    const fileInfo = state.get('fileInfo')
    const uuid = fileInfo.uuid

    return multipartComplete(uuid, options).then(({code, data}) => {
      if (code !== 200 || data.error) {
        return Promise.reject(
          makeError({
            type: 'MULTIPART_COMPLETE_FAILED',
            payload: data,
          }),
        )
      }

      return (data: fileInfo)
    })
  }
}

function handleSuccess(state: $Call<typeof makeState>) {
  return (fileInfo: FileInfo) => {
    const resolve = state.get('resolve')

    state.set('fileInfo', fileInfo)
    state.set('status', 'success')
    state.set('progressListeners', undefined)

    return resolve(fileInfo)
  }
}

function handleFailed(state: $Call<typeof makeState>) {
  return err => {
    const reject = state.get('reject')

    state.set('status', 'failed')
    state.set('progressListeners', undefined)

    return reject(err)
  }
}

function makeState() {
  const state: {
    fileInfo: $Shape<FileInfo>,
    status: 'failed' | 'success' | 'progress',
    cancelUpload: ?() => void,
    resolve: ?(fileInfo: FileInfo) => void,
    reject: ?(err: UCError) => void,
    progressListeners: Array<ProgressListener>,
  } = {
    fileInfo: {},
    status: 'progress',
    cancelUpload: undefined,
    resolve: undefined,
    reject: undefined,
    progressListeners: [],
  }

  return {
    set: (key: string, value: mixed) => (state[key] = value),
    get: (key: string) => state[key],
  }
}

export function uploadMultipart(input: FileData, options: Options): UCFile {
  const state = makeState()

  state.set('fileInfo', extractInfo(input))

  const promise = new Promise((resolve, reject) => {
    state.set('resolve', resolve)
    state.set('reject', reject)
  })

  Promise.resolve()
    .then(getParts(input, state, options))
    .then(updateUuid(state))
    .then(startUploadChunks(input, state))
    .then(trackProgress(state))
    .then(waitForUpload())
    .then(completeUpload(state, options))
    .then(handleSuccess(state))
    .catch(handleFailed(state))

  const ucFile: UCFile = {
    promise,
    cancel: () => {
      const reject = state.get('reject')
      const cancelUpload = state.get('cancelUpload')

      cancelUpload && cancelUpload()
      state.set('status', 'failed')

      reject(makeError({type: 'UPLOAD_CANCELLED'}))
    },
    progress: (callback: ProgressListener) => {
      const listeners = state.get('progressListeners')

      state.set('progressListeners', [...listeners, callback])

      return
    },
    getFileInfo: () => {
      return state.get('fileInfo')
    },
    get status() {
      return state.get('status')
    },
    type: 'file',
  }

  return ucFile
}
