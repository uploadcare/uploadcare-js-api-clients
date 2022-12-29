import { SupportedFileInput } from '../types'

export type FileTransformer = (
  file: SupportedFileInput,
  name: string,
  contentType: string
) => SupportedFileInput

export type GetFormDataFileAppendOptions = (options: {
  [key: string]: string | undefined
}) =>
  | string[]
  | {
      [key: string]: string | undefined
    }[]
