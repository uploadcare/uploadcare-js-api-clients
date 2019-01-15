/* @flow */
import defaultSettings from './default-settings'
import camelizeKeys from './tools/camelizeKeys'
import type {InfoResponse} from './api/info'
import type {FileInfo} from './types'

/**
 * Transforms file info getting from Upload API to pretty info
 *
 * @param {InfoResponse} info
 * @param {string} baseCDN
 * @returns {FileInfo}
 */
export default function prettyFileInfo(info: InfoResponse): FileInfo {
  const {
    uuid,
    filename,
    originalFilename,
    size,
    isStored,
    isImage,
    fileId,
    defaultEffects,
    imageInfo,
    s3Bucket,
  } = camelizeKeys(info)

  const urlBase = s3Bucket
    ? `https://${s3Bucket}.s3.amazonaws.com/${fileId}/${filename}`
    : `${defaultSettings.baseCDN}/${fileId}/`
  const cdnUrlModifiers = defaultEffects ? '-/' + defaultEffects : null
  const cdnUrl = fileId ? urlBase + (cdnUrlModifiers || '') : null
  const originalUrl = fileId ? urlBase : null

  return {
    uuid,
    name: originalFilename,
    size,
    isStored,
    isImage,
    cdnUrl,
    cdnUrlModifiers,
    originalUrl,
    originalImageInfo: imageInfo,
  }
}
