import {MultipartCompleteResponse} from './types'
import {FileData, Settings} from '../../types'
import multipartStart from './multipartStart'
import multipartUpload from './multipartUpload'
import multipartComplete from './multipartComplete'

/**
 * Upload multipart file.
 *
 * @param {FileData} file
 * @param {Settings} settings
 * @return {MultipartUploadInterface}
 */
export default async function multipart(file: FileData, settings: Settings = {}): Promise<MultipartCompleteResponse> {
  const multipartStartUpload = multipartStart(file, settings)
  const {uuid: completeUuid, parts} = await multipartStartUpload

  await multipartUpload(file, parts, settings)

  return multipartComplete(completeUuid, settings)
}
