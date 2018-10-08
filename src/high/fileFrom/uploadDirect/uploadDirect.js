/* @flow */
/* eslint-disable require-jsdoc */

import type {
  FileData,
  UCFile,
  FileInfo,
  ProgressListener,
  UCRequest,
} from '../../../flow-typed'
import type {BaseResponse} from '../../../low/base/flow-typed'
import {base} from '../../../low/base/base'
import {info} from '../../../low/info/info'
import type {Options} from '../flow-typed'
import {extractInfo} from '../extractInfo'
import {makeError} from '../../../util/makeError'

function makeState() {
  const state: {
    fileInfo: $Shape<FileInfo>,
    status: 'failed' | 'success' | 'progress',
  } = {
    fileInfo: {},
    status: 'progress',
  }

  return {
    set: (key: string, value: mixed) => state[key] = value,
    get: (key: string) => state[key],
  }
}

function handleUpload(req: UCRequest<BaseResponse>) {
  return () =>
    req.promise.then(({code, data}) => {
      if (code !== 200 || data.error) {
        return Promise.reject(
          makeError({
            type: 'UPLOAD_FAILED',
            payload: data,
          }),
        )
      }

      const {file: uuid} = data

      return uuid
    })
}

function receiveFileInfo(options: Options) {
  return (uuid: string) =>
    info(uuid, {publicKey: options.publicKey}).then(({code, data}) => {
      if (code !== 200 || data.error) {
        return Promise.reject(
          makeError({
            type: 'INFO_REQUEST_FAILED',
            payload: data,
          }),
        )
      }

      return (data: FileInfo)
    })
}

function handleSuccess(state: $Call<typeof makeState>) {
  return (fileInfo: FileInfo) => {
    state.set('fileInfo', fileInfo)
    state.set('status', 'success')

    return fileInfo
  }
}

function handleFailed(state: $Call<typeof makeState>) {
  return (err) => {
    state.set('status', 'failed')

    return Promise.reject(err)
  }
}

export function uploadDirect(input: FileData, options: Options): UCFile {
  const uploadReq = base(input, {
    publicKey: options.publicKey,
    store: typeof options.store === 'undefined' ? 'auto' : options.store,
  })

  const state = makeState()

  state.set('fileInfo', extractInfo(input))

  const promise = Promise.resolve()
    .then(handleUpload(uploadReq))
    .then(receiveFileInfo(options))
    .then(handleSuccess(state))
    .catch(handleFailed(state))

  const ucFile: UCFile = {
    promise,
    cancel: uploadReq.cancel,
    progress: (callback: ProgressListener) => {
      uploadReq.progress(callback)

      return
    },
    getFileInfo: () => state.get('fileInfo'),
    get status() {
      return state.get('status')
    },
    type: 'file',
  }

  return ucFile
}
