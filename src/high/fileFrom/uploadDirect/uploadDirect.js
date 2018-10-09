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
import {extractResponseErrors} from '../../extractResponseErrors'

function makeState() {
  const state: {
    fileInfo: $Shape<FileInfo>,
    status: 'failed' | 'cancelled' | 'success' | 'progress',
    request: ?UCRequest<BaseResponse>,
  } = {
    fileInfo: {},
    status: 'progress',
    request: undefined,
  }

  return {
    set: (key: string, value: mixed) => (state[key] = value),
    get: (key: string) => state[key],
  }
}

function startUpload(
  input: FileData,
  options: Options,
  state: $Call<typeof makeState>,
) {
  const request = base(input, {
    publicKey: options.publicKey,
    store: options.store,
    signature: options.signature,
    expire: options.expire,
    filename: options.filename,
    source: options.source,
  })

  state.set('request', request)

  return request.promise
    .then(extractResponseErrors)
    .then(({file: uuid}) => uuid)
}

function receiveFileInfo(options: Options) {
  return (uuid: string) =>
    info(uuid, {publicKey: options.publicKey}).then(extractResponseErrors)
}

function handleSuccess(state: $Call<typeof makeState>) {
  return (fileInfo: FileInfo) => {
    state.set('fileInfo', fileInfo)
    state.set('status', 'success')

    return fileInfo
  }
}

function handleFailed(state: $Call<typeof makeState>) {
  return err => {
    if (err.type) {
      if (err.type === 'UPLOAD_CANCEL') {
        state.set('status', 'cancelled')
      }
      else {
        state.set('status', 'failed')
      }

      return Promise.reject(err)
    }

    state.set('status', 'failed')

    if (!err.response) {
      return Promise.reject(
        makeError({
          type: 'NETWORK_ERROR',
          error: err,
        }),
      )
    }

    return Promise.reject(
      makeError({
        type: 'UNKNOWN_ERROR',
        error: err,
      }),
    )
  }
}

export function uploadDirect(input: FileData, options: Options): UCFile {
  const state = makeState()

  state.set('fileInfo', extractInfo(input, options))

  const promise = startUpload(input, options, state)
    .then(receiveFileInfo(options))
    .then(handleSuccess(state))
    .catch(handleFailed(state))

  const ucFile: UCFile = {
    promise,
    cancel: () => {
      state.set('status', 'cancelled')
      state.get('request').cancel()
    },
    progress: (callback: ProgressListener) => {
      state.get('request').progress(callback)

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
