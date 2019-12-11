import { UploadcareFileInterface, UploadcareGroupInterface } from "./types"
import { FileInfoInterface, GroupId, GroupInfoInterface } from "./api/types"

export class UploadcareGroup implements UploadcareGroupInterface {
  readonly uuid: GroupId
  readonly filesCount: string
  readonly totalSize: number
  readonly isStored: boolean
  readonly isImage: boolean
  readonly cdnUrl: string
  readonly files: FileInfoInterface[]
  readonly createdAt: string
  readonly storedAt: string | null = null

  constructor(group: UploadcareGroupInterface) {
    this.uuid = group.uuid
    this.filesCount = group.filesCount
    this.totalSize = group.totalSize
    this.isStored = group.isStored
    this.isImage = group.isImage
    this.cdnUrl = group.cdnUrl
    this.files = group.files
    this.createdAt = group.createdAt
    this.storedAt = group.storedAt
  }

  static fromGroupInfo(
    groupInfo: GroupInfoInterface
  ): UploadcareGroupInterface {
    return new UploadcareGroup({
      uuid: groupInfo.id,
      filesCount: groupInfo.files_count,
      totalSize: groupInfo.files.reduce((acc, file) => acc + file.size, 0),
      isStored: !!groupInfo.datetime_stored,
      isImage: !!groupInfo.files.filter(file => file.is_image).length,
      cdnUrl: groupInfo.cdn_url,
      files: groupInfo.files,
      createdAt: groupInfo.datetime_created,
      storedAt: groupInfo.datetime_stored
    })
  }
}
