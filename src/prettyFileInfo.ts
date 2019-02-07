import defaultSettings from './defaultSettings'
import camelizeKeys from './tools/camelizeKeys'
import {InfoResponse} from './api/info'
import {UFile} from './types'

/**
 * Transforms file info getting from Upload API to pretty info
 *
 * @param {InfoResponse} info
 * @returns {UFile}
 */
export default function prettyFileInfo(info: InfoResponse): UFile {
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
