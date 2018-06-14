/* @flow */

const isBrowser = () => typeof window == 'object'
const isObject = (data: any) => typeof data === 'object'
const isFunction = (data: any) => typeof data === 'function'

const isStream = (data: any) => isObject(data) && isFunction(data.pipe)
const isBuffer = (data: any) => isFunction(data.constructor.isBuffer)
const isArrayBuffer = (data: any) => data.constructor.name === 'ArrayBuffer'

const isBlob = (data: any) => isBrowser() && window.Blob && data instanceof Blob
const isFile = (data: any) => isBrowser() && window.File && data instanceof File

export const isFileData = (data: any) =>
  isFile(data) || isBlob(data) || isBuffer(data) || isStream(data)

export const isBinaryData = (data: any) => isBuffer(data) || isArrayBuffer(data)
