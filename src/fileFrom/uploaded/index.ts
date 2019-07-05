import {FileUpload} from '../FileUpload'
import {FileUploadInterface} from '../types'

export const fileFromUploaded = (): FileUploadInterface => {
  return new FileUpload()
}
