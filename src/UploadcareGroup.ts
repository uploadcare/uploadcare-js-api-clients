import {UploadcareGroupInterface} from './types'
import {FileInfo, GroupId, GroupInfo} from './api/types'

export class UploadcareGroup implements UploadcareGroupInterface {
  private readonly groupInfo: GroupInfo

  readonly uuid: GroupId
  readonly filesCount: string
  readonly totalSize: number
  readonly isStored: boolean
  readonly isImage: boolean
  readonly cdnUrl: string
  readonly files: FileInfo[]
  readonly createdAt: string
  readonly storedAt: string | null = null

  constructor(groupInfo: GroupInfo) {
    this.groupInfo = groupInfo

    this.uuid = groupInfo.id
    this.filesCount = groupInfo.files_count
    this.totalSize = groupInfo.files.reduce((acc, file) => acc + file.size, 0)
    this.isStored = !!groupInfo.datetime_stored
    this.isImage = !!groupInfo.files.filter(file => file.is_image).length
    this.cdnUrl = groupInfo.cdn_url
    this.files = groupInfo.files
    this.createdAt = groupInfo.datetime_created
    this.storedAt = groupInfo.datetime_stored
  }
}
