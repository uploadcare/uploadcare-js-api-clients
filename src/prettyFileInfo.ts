import defaultSettings from './defaultSettings'
import camelizeKeys from './tools/camelizeKeys'
import {SettingsInterface, UploadcareFileInterface} from './types'
import {FileInfoInterface} from './api/types'

/**
 * Transforms file info getting from Upload API to pretty info.
 *
 * @param {FileInfoInterface} info
 * @param {SettingsInterface} settings
 * @returns {UploadcareFileInterface}
 */
export default function prettyFileInfo(info: FileInfoInterface, settings: SettingsInterface = {}): UploadcareFileInterface {
  const {
    // @ts-ignore
    uuid,
    // @ts-ignore
    filename,
    // @ts-ignore
    originalFilename,
    // @ts-ignore
    size,
    // @ts-ignore
    isStored,
    // @ts-ignore
    isImage,
    // @ts-ignore
    fileId,
    // @ts-ignore
    defaultEffects,
    // @ts-ignore
    imageInfo,
    // @ts-ignore
    s3Bucket,
  } = camelizeKeys(info)

  const extendedSettings = {
    ...defaultSettings,
    ...settings,
  }
  const urlBase = s3Bucket
    ? `https://${s3Bucket}.s3.amazonaws.com/${fileId}/${filename}`
    : `${extendedSettings.baseCDN}/${fileId}/`
  const cdnUrlModifiers = defaultEffects ? '-/' + defaultEffects : null
  const cdnUrl = fileId ? urlBase + (cdnUrlModifiers || '') : null
  const originalUrl = fileId ? urlBase : null

  return {
    uuid,
    name: settings.fileName || originalFilename,
    size,
    isStored,
    isImage,
    cdnUrl,
    cdnUrlModifiers,
    originalUrl,
    originalFilename,
    originalImageInfo: imageInfo,
  }
}
