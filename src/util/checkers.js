/* @flow */

export const isBrowser = (): boolean %checks => typeof window == 'object'
export const isObject = (data: any): boolean %checks => typeof data === 'object'
export const isFunction = (data: any): boolean %checks => typeof data === 'function'

export const isStream = (data: any): boolean %checks =>
  isObject(data) && isFunction(data.pipe)
export const isBuffer = (data: any): boolean %checks =>
  isFunction(data.constructor.isBuffer)
export const isArrayBuffer = (data: any): boolean %checks =>
  data.constructor.name === 'ArrayBuffer'

export const isBlob = (data: any): boolean %checks =>
  isBrowser() && window.Blob && data instanceof Blob
export const isFile = (data: any): boolean %checks =>
  isBrowser() && window.File && data instanceof File

export const isFileData = (data: any): boolean %checks =>
  isFile(data) ||
  isBlob(data) ||
  isBuffer(data) ||
  isStream(data) ||
  isArrayBuffer(data)

export const isBinaryData = (data: any): boolean %checks =>
  isBuffer(data) || isArrayBuffer(data)
