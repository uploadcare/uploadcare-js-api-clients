import { FileInfo } from './FileInfo'

export type GroupInfo = {
  files: FileInfo[]
  id: string
  datetimeCreated: string
  filesCount: number
  cdnUrl: string
  url: string
}

export type GroupInfoShort = Omit<GroupInfo, 'files'>
