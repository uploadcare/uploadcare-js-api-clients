/* @flow */
/* eslint-disable require-jsdoc */

import type {
  FileData,
  UCFile,
  FileInfo,
  ProgressListener,
  UCRequest,
} from '../../flow-typed'
import type {BaseResponse} from '../../low/base/flow-typed'
import {base} from '../../low/base/base'
import {info} from '../../low/info/info'
import type {Options} from './flow-typed'
import {extractInfo} from './extractInfo'
import {makeError} from '../../util/makeError'

function handleUpload(req: UCRequest<BaseResponse>) {
  return () =>
    req.promise.then(({code, data}) => {
      if (code !== 200 || data.error) {
        return Promise.reject(makeError({
          type: 'UPLOAD_FAILED',
          payload: data,
        }))
      }

      const {file: uuid} = data

      return uuid
    })
}

function updateFileInfo(fileInfo: $Shape<FileInfo>, options: Options) {
  return (uuid: string) =>
    info(uuid, {publicKey: options.publicKey}).then(({code, data}) => {
      if (code !== 200 || data.error) {
        return Promise.reject(makeError({
          type: 'INFO_REQUEST_FAILED',
          payload: data,
        }))
      }

      return (data: FileInfo)
    })
}

export function simpleUpload(input: FileData, options: Options): UCFile {
  const uploadReq = base(input, {
    publicKey: options.publicKey,
    store: typeof options.store === 'undefined' ? 'auto' : options.store,
  })

  const fileInfo: $Shape<FileInfo> = extractInfo(input)
  const state = {
    fileInfo,
    status: 'progress',
  }

  const promise = Promise.resolve()
    .then(handleUpload(uploadReq))
    .then(updateFileInfo(fileInfo, options))
    .then(fileInfo => {
      state.status = 'success'

      return fileInfo
    })
    .catch(err => {
      state.status = 'failed'

      return Promise.reject(err)
    })

  const ucFile: UCFile = {
    promise,
    cancel: uploadReq.cancel,
    progress: (callback: ProgressListener) => {
      uploadReq.progress(callback)

      return
    },
    getFileInfo: () => fileInfo,
    get status() {
      return state.status
    },
    type: 'file',
  }

  return ucFile
}
