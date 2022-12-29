import { BrowserFile, NodeFile } from '../request/types'

export type ReactNativeAsset = { type: string; uri: string; name?: string }

export type FileTransformer = (
  file: NodeFile | BrowserFile,
  name: string,
  contentType: string
) => NodeFile | BrowserFile | ReactNativeAsset

export type GetFormDataFileAppendOptions = (options: {
  [key: string]: string | undefined
}) =>
  | string[]
  | {
      [key: string]: string | undefined
    }[]
